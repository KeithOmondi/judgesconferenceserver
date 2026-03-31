import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.model";
import { sendTokens } from "../utils/sendToken";
import { env } from "../config/env";
import { hashToken } from "../utils/hashToken";
import {
  deleteRefreshToken,
  deleteUserTokens,
  findRefreshToken,
} from "../models/refreshToken.store";

/* =====================================
    1️⃣ LOGIN (Hybrid: PJ vs Email/Pass)
===================================== */
export const login = async (req: Request, res: Response) => {
  try {
    const { pj, email, password } = req.body;

    // --- LANE A: ADMIN & JUDGE (PJ Only) ---
    if (pj && !email) {
      const user = await User.findOne({ pj }).select("+role +isActive +currentSessionId");

      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid PJ number" });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: "Account is inactive" });
      }

      // Security Guard: Prevent DRs from using the PJ-only lane
      if (user.role === "dr") {
        return res.status(403).json({ 
          success: false, 
          message: "Staff (DR) must login with Email and Password" 
        });
      }

      // Success for Admin/Judge
      const newSessionId = await user.generateNewSession();
      console.log(`✅ [LOGIN-PJ] Role: ${user.role} | PJ: ${pj}`);
      return sendTokens(res, user);
    }

    // --- LANE B: DR (Email + Password + Force Reset) ---
    if (email && password) {
      const user = await User.findOne({ email }).select(
        "+password +role +isVerified +isActive +loginAttempts +lockUntil +currentSessionId"
      );

      if (!user || user.role !== "dr") {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: "Account is inactive" });
      }

      if (user.isLocked()) {
        return res.status(423).json({
          success: false,
          message: `Locked. Try again after ${user.lockUntil?.toLocaleTimeString()}`,
        });
      }

      // Verify Password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        await User.failedLogin(email);
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      // 🛑 FORCE PASSWORD CHANGE CHECK
      if (!user.isVerified) {
        return res.status(202).json({
          success: true,
          requiresPasswordChange: true,
          message: "First-time login: Please set a new password",
          userId: user._id 
        });
      }

      // Success for DR
      const newSessionId = await user.generateNewSession();
      console.log(`✅ [LOGIN-DR] Email: ${email} | Session: ${newSessionId}`);
      return sendTokens(res, user);
    }

    // Fallback if payload is empty or malformed
    return res.status(400).json({ 
      success: false, 
      message: "Please provide PJ Number or Email/Password" 
    });

  } catch (error: any) {
    console.error("🔥 [LOGIN] Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
};

/* =====================================
    5️⃣ SETUP PASSWORD (First-time DR)
===================================== */
export const setupPassword = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword || newPassword.length < 5) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    // 1. Find user (must select password to allow the 'save' middleware to see it)
    const user = await User.findById(userId).select("+password +isActive");

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: "User not found or inactive" });
    }

    // 2. Update fields
    user.password = newPassword; // This marks 'password' as modified
    user.isVerified = true;
    
    // 3. Use your Model's built-in session rotator
    // This method handles: new UUID, resetting login attempts, and THE SAVE() CALL.
    await user.generateNewSession(); 

    console.log(`✅ [SETUP-PASS] Password hashed and session started for: ${user.email}`);

    return sendTokens(res, user);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   2️⃣ REFRESH TOKEN (With Session Check)
===================================== */
export const refreshHandler = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  const isProduction = env.NODE_ENV === "production";
  const clearOptions = {
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    partitioned: isProduction,
  };

  try {
    // 1. Verify Refresh Token
    const decoded = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET as string
    ) as JwtPayload & { id: string; sessionId: string };

    // 2. Check DB Store
    const tokenHash = hashToken(refreshToken);
    const storedToken = await findRefreshToken(tokenHash);

    if (!storedToken) {
      res.clearCookie("accessToken", clearOptions);
      res.clearCookie("refreshToken", clearOptions);
      return res.sendStatus(403); // Potential reuse attack
    }

    // 3. Clear the used refresh token (Refresh Token Rotation)
    await deleteRefreshToken(tokenHash);

    // 4. Validate User & Session
    const user = await User.findById(decoded.id).select("+currentSessionId +isActive");
    
    if (!user || !user.isActive) {
      return res.sendStatus(401);
    }

    // Check if user has logged in elsewhere since this token was issued
    if (user.currentSessionId && decoded.sessionId !== user.currentSessionId) {
      res.clearCookie("accessToken", clearOptions);
      res.clearCookie("refreshToken", clearOptions);
      return res.status(401).json({ 
        success: false, 
        message: "Session expired: Logged in on another device" 
      });
    }

    // 5. Issue new token pair
    return sendTokens(res, user);
    
  } catch (error) {
    res.clearCookie("accessToken", clearOptions);
    res.clearCookie("refreshToken", clearOptions);
    return res.sendStatus(403);
  }
};

/* =====================================
    3️⃣ LOGOUT
===================================== */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    // 1. Remove the specific refresh token from the DB
    if (refreshToken) {
      await deleteRefreshToken(hashToken(refreshToken));
    }

    // 2. Reset the Session ID on the User model
    // This effectively invalidates the current session lock
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, { 
        currentSessionId: null 
      });
    }

    const isProduction = env.NODE_ENV === "production";
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      partitioned: isProduction,
    };

    // 3. Clear cookies from the browser
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout Error:", error.message);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
};

/* =====================================
    4️⃣ LOGOUT ALL (Force global reset)
===================================== */
export const logoutAll = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.sendStatus(401);

    // 1. Wipe ALL refresh tokens associated with this user from the DB
    await deleteUserTokens(userId);

    // 2. Kill the session lock
    // This forces any existing Access Tokens to fail the session check on next refresh
    await User.findByIdAndUpdate(userId, { currentSessionId: null });

    const isProduction = env.NODE_ENV === "production";
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      partitioned: isProduction,
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({ success: true, message: "Logged out from all devices" });
  } catch (error: any) {
    console.error("LogoutAll Error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};