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
  const { pj } = req.body;

  if (!pj) {
    return res.status(400).json({ 
      success: false, 
      message: "PJ number is required" 
    });
  }

  // 1. Find user by their PJ identifier
  const user = await User.findOne({ pj });
  
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid pj number" });
  }

  // 2. Check if account is active or locked (if you still want security)
  if (!user.isActive) {
    return res.status(403).json({ 
      success: false, 
      message: "This account is inactive" 
    });
  }

  if (user.isLocked()) {
    return res.status(423).json({ 
      success: false, 
      message: "Account temporarily locked" 
    });
  }

  // 3. Success: Issue tokens and redirect to dashboard
  // (Clear any previous failed attempts since they just got in)
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  sendTokens(res, user);
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