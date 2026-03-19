import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/user.model";

export type UserRole = "admin" | "judge" | "guest";

/* ================================
   1️⃣ Token Payload Interface
================================ */
interface TokenPayload extends JwtPayload {
  id: string;
  role?: UserRole;
  sessionId?: string; // 👈 NEW: Added to track unique session
  resetOnly?: boolean;
}

/* ================================
   2️⃣ Extended Request Interface
================================ */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: UserRole;
    resetOnly?: boolean;
    sessionId?: string; // 👈 NEW
  };
}

/* ================================
   3️⃣ Protect (Now with Session Validation)
================================ */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = (req as any).cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please login",
      });
    }

    const decoded = jwt.verify(
      token,
      env.JWT_SECRET as string
    ) as TokenPayload;

    // 🚫 Block reset-only tokens
    if (decoded.resetOnly) {
      return res.status(403).json({
        success: false,
        message: "Password reset session cannot access this resource",
      });
    }

    /* ---------------------------------------------------------
       🔐 SINGLE DEVICE CHECK
       Compare JWT sessionId with the one in the Database
    --------------------------------------------------------- */
    const user = await User.findById(decoded.id).select("+currentSessionId +isActive");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists or is deactivated",
      });
    }

    // If the sessionId in the token doesn't match the DB, someone else logged in
    if (user.currentSessionId && decoded.sessionId !== user.currentSessionId) {
      return res.status(401).json({
        success: false,
        message: "Logged out: Another device has logged into this account",
      });
    }

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
   4️⃣ Protect Reset-Only Routes
================================ */
// (Remains synchronous as reset tokens usually skip the session-lock logic)
export const protectResetOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
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

    req.user = { id: decoded.id, resetOnly: true };
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Reset session expired" });
  }
};

/* ================================
   5️⃣ Role Authorization
================================ */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role}) is not authorized`,
      });
    }
    next();
  };
};