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
   1️⃣ LOGIN (PJ-only with Session Lock)
===================================== */
export const login = async (req: Request, res: Response) => {
  try {
    const { pj } = req.body;

    if (!pj) {
      return res.status(400).json({
        success: false,
        message: "PJ number is required",
      });
    }

    const user = await User.findOne({ pj }).select("+loginAttempts +lockUntil +currentSessionId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid PJ number",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive",
      });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: "Account temporarily locked",
      });
    }

    const newSessionId = await user.generateNewSession();
    console.log(`✅ [LOGIN] PJ: ${pj} | New Session: ${newSessionId}`);

    return sendTokens(res, user);

  } catch (error: any) {
    console.error("🔥 [LOGIN] Server error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

/* =====================================
   2️⃣ REFRESH TOKEN (With Session Check)
===================================== */
export const refreshHandler = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.sendStatus(401);

  const isProduction = env.NODE_ENV === "production";

  // 👇 shared cookie options used for clearing
  const clearOptions = {
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    partitioned: isProduction, // 👈 added
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET as string
    ) as JwtPayload & { sessionId: string };

    const tokenHash = hashToken(refreshToken);
    const storedToken = await findRefreshToken(tokenHash);

    if (!storedToken) {
      res.clearCookie("accessToken", clearOptions) // 👈 updated
      res.clearCookie("refreshToken", clearOptions) // 👈 updated
      return res.sendStatus(403);
    }

    await deleteRefreshToken(tokenHash);

    const user = await User.findById(decoded.id).select("+currentSessionId +isActive");
    if (!user || !user.isActive) return res.sendStatus(404);

    if (user.currentSessionId && decoded.sessionId !== user.currentSessionId) {
      res.clearCookie("accessToken", clearOptions) // 👈 updated
      res.clearCookie("refreshToken", clearOptions) // 👈 updated
      return res.status(401).json({ 
        success: false, 
        message: "Session expired: Logged in on another device" 
      });
    }

    return sendTokens(res, user);
    
  } catch (error) {
    res.clearCookie("accessToken", clearOptions) // 👈 updated
    res.clearCookie("refreshToken", clearOptions) // 👈 updated
    return res.sendStatus(403);
  }
};

/* =====================================
    3️⃣ LOGOUT
===================================== */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    // 1. Revoke the Refresh Token in the DB
    if (refreshToken) {
      await deleteRefreshToken(hashToken(refreshToken));
    }

    // 2. Invalidate the Session Lock
    // Use req.user.id if available from your auth middleware
    const userId = (req as any).user?.id;
    if (userId) {
      await User.findByIdAndUpdate(userId, { 
        currentSessionId: null,
        // Optional: clear any temp flags if needed
      });
    }

    const isProduction = env.NODE_ENV === "production";
    
    // 3. Clear Cookies with exact matching attributes
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      partitioned: isProduction,
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Session terminated and records cleared",
    });
  } catch (error) {
    console.error("🔥 Logout Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* =====================================
    4️⃣ LOGOUT ALL (Force global reset)
===================================== */
export const logoutAll = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await deleteUserTokens(userId);
    await User.findByIdAndUpdate(userId, { currentSessionId: null });

    const isProduction = env.NODE_ENV === "production"; // 👈 using env instead of process.env
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      partitioned: isProduction, // 👈 added
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};