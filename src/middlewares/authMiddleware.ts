import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { User, UserRole } from "../models/user.model";

/* ================================
    1️⃣ Token Payload Interface
================================ */
interface TokenPayload extends JwtPayload {
  id: string;
  role: UserRole;
  sessionId: string; 
  iat: number; 
  resetOnly?: boolean;
}

/* ================================
    2️⃣ Protect (Standard Request)
================================ */
export const protect = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // 1) Extract Token
    const token =
      req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : (req as any).cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please login",
      });
    }

    // 2) Verify Token
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET as string
    ) as TokenPayload;

    if (decoded.resetOnly) {
      return res.status(403).json({
        success: false,
        message: "Password reset session cannot access this resource",
      });
    }

    // 3) Check User & Status
    const user = await User.findById(decoded.id).select("+currentSessionId +isActive +passwordChangedAt");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists or is deactivated",
      });
    }

    // 4) Session Validation
    if (user.currentSessionId && decoded.sessionId !== user.currentSessionId) {
      return res.status(401).json({
        success: false,
        message: "Logged out: Your session has been invalidated by a newer login",
      });
    }

    // 5) Password Freshness Check
    if (user.passwordChangedAt) {
      const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          success: false,
          message: "Password recently changed. Please log in again.",
        });
      }
    }

    // 6) Grant Access (req.user is recognized thanks to global augmentation)
    req.user = {
      id: decoded.id,
      role: decoded.role,
      resetOnly: decoded.resetOnly,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid token",
    });
  }
};

/* ================================
    3️⃣ Protect Reset-Only Routes
=============================== */
export const protectResetOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Reset session required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET as string) as TokenPayload;

    if (!decoded.resetOnly) {
      return res.status(403).json({ success: false, message: "Invalid reset session" });
    }

    req.user = { 
        id: decoded.id, 
        role: decoded.role,
        resetOnly: true 
    };
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Reset session expired" });
  }
};

/* ================================
    4️⃣ Role Authorization
================================ */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists and if their role is in the allowed list
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Your role (${req.user?.role}) does not have permission`,
      });
    }
    next();
  };
};