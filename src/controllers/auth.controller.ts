import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.model";
import { sendTokens } from "../utils/sendToken";
import { env } from "../config/env";
import { hashToken } from "../utils/hashToken";
import {
  deleteRefreshToken,
  findRefreshToken,
} from "../models/refreshToken.store";
import mailService, { sendPasswordResetMail } from "../utils/sendMail";
import crypto from "crypto";

/* --- Helper for Cookie Options (DRY) --- */
const getCookieOptions = (isProduction: boolean) => ({
  path: "/",
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  partitioned: isProduction,
});

/* =====================================
    1️⃣ LOGIN (Hybrid: PJ vs Email/Pass)
===================================== */
export const login = async (req: Request, res: Response) => {
  try {
    const { pj, email, password } = req.body;
    const isProduction = env.NODE_ENV === "production";

    // --- LANE A: ADMIN & JUDGE (PJ Only) ---
    if (pj && !email) {
      const user = await User.findOne({ pj }).select("+role +isActive +currentSessionId");

      // PRODUCTION TIP: Use generic messages even if the PJ is wrong to prevent scraping
      if (!user || !user.isActive || user.role === "dr") {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      await user.generateNewSession();
      console.log(`✅ [LOGIN-PJ] Role: ${user.role} | PJ: ${pj}`);
      return sendTokens(res, user);
    }

    // --- LANE B: DR (Email + Password) ---
    if (email && password) {
      const user = await User.findOne({ email }).select(
        "+password +role +isVerified +isActive +loginAttempts +lockUntil +currentSessionId"
      );

      // Generic check for user existence and role
      if (!user || user.role !== "dr" || !user.isActive) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      // Brute-force protection check
      if (user.isLocked()) {
        return res.status(423).json({
          success: false,
          message: `Account locked. Try again after ${user.lockUntil?.toLocaleTimeString()}`,
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        await User.failedLogin(email);
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      // Force Password Change for first-time DRs
      if (!user.isVerified) {
        return res.status(202).json({
          success: true,
          requiresPasswordChange: true,
          message: "Account verification required",
          userId: user._id, // In a high-security env, use a short-lived token here instead
        });
      }

      await user.generateNewSession();
      return sendTokens(res, user);
    }

    return res.status(400).json({ success: false, message: "Missing login parameters" });
  } catch (error: any) {
    console.error("🔥 [LOGIN ERROR]:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* =====================================
    2️⃣ SETUP PASSWORD (First-time DR)
===================================== */
export const setupPassword = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    // Production Strength: Minimum 10 chars, check for complexity in real-world use
    if (!userId || !newPassword || newPassword.length < 10) {
      return res.status(400).json({ success: false, message: "Password does not meet requirements" });
    }

    const user = await User.findById(userId).select("+password +isActive");

    if (!user || !user.isActive || user.isVerified) {
      return res.status(403).json({ success: false, message: "Action not permitted" });
    }

    user.password = newPassword; 
    user.isVerified = true;
    
    // Generates new UUID, resets attempts, and SAVES the user
    await user.generateNewSession(); 

    return sendTokens(res, user);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Password setup failed" });
  }
};

/* =====================================
    3️⃣ REFRESH TOKEN (Rotation & Session Lock)
===================================== */
export const refreshHandler = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  const isProduction = env.NODE_ENV === "production";
  const clearOptions = getCookieOptions(isProduction);

  if (!refreshToken) return res.sendStatus(401);

  try {
    // 1. JWT Verify
    const decoded = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET as string
    ) as JwtPayload & { id: string; sessionId: string };

    // 2. Refresh Token Rotation (Detection of Reuse)
    const tokenHash = hashToken(refreshToken);
    const storedToken = await findRefreshToken(tokenHash);

    if (!storedToken) {
      // Potential theft detected: clear all cookies
      res.clearCookie("accessToken", clearOptions);
      res.clearCookie("refreshToken", clearOptions);
      return res.sendStatus(403); 
    }

    // 3. User Validation
    const user = await User.findById(decoded.id).select("+currentSessionId +isActive");
    if (!user || !user.isActive) return res.sendStatus(401);

    // 4. Multi-Device/Session Check
    if (user.currentSessionId && decoded.sessionId !== user.currentSessionId) {
      res.clearCookie("accessToken", clearOptions);
      res.clearCookie("refreshToken", clearOptions);
      return res.status(401).json({ success: false, message: "Session expired: Logged in elsewhere" });
    }

    // 5. Invalidate the old refresh token AFTER verification
    await deleteRefreshToken(tokenHash);

    return sendTokens(res, user);
  } catch (error) {
    res.clearCookie("accessToken", clearOptions);
    res.clearCookie("refreshToken", clearOptions);
    return res.sendStatus(403);
  }
};

/* =====================================
    4️⃣ LOGOUT
===================================== */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const isProduction = env.NODE_ENV === "production";
    const cookieOptions = getCookieOptions(isProduction);

    if (refreshToken) {
      await deleteRefreshToken(hashToken(refreshToken));
    }

    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, { currentSessionId: null });
    }

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
};

/* =====================================
    5️⃣ FORGOT PASSWORD (Request Link)
===================================== */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email }).select("+isActive");

    if (!user || !user.isActive) {
      return res.status(200).json({ 
        success: true, 
        message: "If an account exists with this email, a reset link has been sent." 
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      // 2. Updated this call to use mailService
      await mailService.sendPasswordResetMail(user.email, resetUrl, user.name);

      return res.status(200).json({ 
        success: true, 
        message: "Secure reset link has been sent to your email." 
      });
    } catch (mailError: any) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: "Failed to send reset email." });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* =====================================
    6️⃣ RESET PASSWORD (Update Password)
===================================== */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const { password } = req.body;

    if (!token || !password || password.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid request or weak password." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +isActive");

    if (!user || !user.isActive) {
      return res.status(400).json({ success: false, message: "Link expired or invalid." });
    }

    // 3. IMPORTANT: Update and SAVE to trigger .pre('save') hashing
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // generateNewSession() should include a user.save() call internally.
    // If it doesn't, ensure you call await user.save() here.
    await user.generateNewSession(); 

    return res.status(200).json({ 
      success: true, 
      message: "Password reset successfully. You may now login." 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};