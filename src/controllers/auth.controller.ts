// src/controllers/auth.controller.ts
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
   1️⃣ LOGIN (PJ-only)
===================================== */
export const login = async (req: Request, res: Response) => {
  try {
    const { pj } = req.body;

    console.log("🚀 [LOGIN] Incoming request:", { pj });

    /* =========================
       1️⃣ Validate Input
    ========================= */
    if (!pj) {
      console.warn("⚠️ [LOGIN] Missing PJ number");
      return res.status(400).json({
        success: false,
        message: "PJ number is required",
      });
    }

    /* =========================
       2️⃣ Find User
    ========================= */
    const user = await User.findOne({ pj }).select("+loginAttempts +lockUntil");

    if (!user) {
      console.warn(`❌ [LOGIN] User not found | PJ: ${pj}`);
      return res.status(401).json({
        success: false,
        message: "Invalid PJ number",
      });
    }

    /* =========================
       3️⃣ Account Status Checks
    ========================= */
    if (!user.isActive) {
      console.warn(`🚫 [LOGIN] Inactive account | PJ: ${pj}`);
      return res.status(403).json({
        success: false,
        message: "This account is inactive",
      });
    }

    if (user.isLocked && user.isLocked()) {
      console.warn(`🔒 [LOGIN] Account locked | PJ: ${pj}`);
      return res.status(423).json({
        success: false,
        message: "Account temporarily locked",
      });
    }

    /* =========================
       4️⃣ Reset Lock Counters
    ========================= */
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    console.log(`✅ [LOGIN] Success | PJ: ${pj} | Name: ${user.name}`);

    /* =========================
       5️⃣ Send Auth Tokens
    ========================= */
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
   2️⃣ REFRESH TOKEN (Rotation)
===================================== */
export const refreshHandler = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET as string
    ) as JwtPayload;

    const tokenHash = hashToken(refreshToken);
    const storedToken = await findRefreshToken(tokenHash);

    if (!storedToken) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.sendStatus(403);
    }

    await deleteRefreshToken(tokenHash);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.sendStatus(404);

    sendTokens(res, user);
  } catch {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.sendStatus(403);
  }
};

/* =====================================
   3️⃣ LOGOUT
===================================== */
export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await deleteRefreshToken(hashToken(refreshToken));
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

/* =====================================
   4️⃣ LOGOUT ALL
===================================== */
export const logoutAll = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  await deleteUserTokens(userId);

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    message: "Logged out from all devices",
  });
};