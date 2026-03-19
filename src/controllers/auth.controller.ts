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

    // 1. Validate Input
    if (!pj) {
      return res.status(400).json({
        success: false,
        message: "PJ number is required",
      });
    }

    // 2. Find User with security fields
    const user = await User.findOne({ pj }).select("+loginAttempts +lockUntil +currentSessionId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid PJ number",
      });
    }

    // 3. Account Status Checks
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

    /* 🔐 SESSION ROTATION & LAST LOGIN
       This generates a new unique ID and updates user.lastLogin.
       Any previous device holding an old ID will now be rejected.
    */
    const newSessionId = await user.generateNewSession();

    console.log(`✅ [LOGIN] PJ: ${pj} | New Session: ${newSessionId}`);

    // 4. Send Auth Tokens (Passes user object containing currentSessionId)
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

  try {
    // Verify token and extract sessionId
    const decoded = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET as string
    ) as JwtPayload & { sessionId: string };

    const tokenHash = hashToken(refreshToken);
    const storedToken = await findRefreshToken(tokenHash);

    // If token isn't in DB (reused/logged out), clear all cookies
    if (!storedToken) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.sendStatus(403);
    }

    // Rotate the refresh token (delete old one)
    await deleteRefreshToken(tokenHash);

    // Get fresh user data from DB
    const user = await User.findById(decoded.id).select("+currentSessionId +isActive");
    if (!user || !user.isActive) return res.sendStatus(404);

    /* 🔐 SESSION VALIDATION
       If the sessionId in the Refresh Token doesn't match the DB,
       it means a newer login occurred on another device.
    */
    if (user.currentSessionId && decoded.sessionId !== user.currentSessionId) {
       res.clearCookie("accessToken");
       res.clearCookie("refreshToken");
       return res.status(401).json({ 
         success: false, 
         message: "Session expired: Logged in on another device" 
       });
    }

    // Success: Issue new tokens using the same sessionId
    return sendTokens(res, user);
    
  } catch (error) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.sendStatus(403);
  }
};

/* =====================================
    3️⃣ LOGOUT
===================================== */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await deleteRefreshToken(hashToken(refreshToken));
    }

    // Clear session ID from DB so the user is truly "logged out"
    const userId = (req as any).user?.id;
    if (userId) {
       await User.findByIdAndUpdate(userId, { currentSessionId: null });
    }

    const isProduction = process.env.NODE_ENV === "production";
    
    // Standardized cookie options to ensure deletion works
    const cookieOptions = {
      path: "/", // CRITICAL: Must match the path used in sendTokens
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
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

    // 1. Delete all refresh tokens from DB store
    await deleteUserTokens(userId);

    // 2. Clear currentSessionId in User model to kick everyone out
    await User.findByIdAndUpdate(userId, { currentSessionId: null });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
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