import { Response } from "express";
import { generateTokens } from "../services/token.service";
import { env } from "../config/env";
import ms, { StringValue } from "ms";

interface TokenUser {
  id: string;               // internal DB _id
  pj: string;               // 👈 Added PJ
  name: string;
  email: string;
  role: string;
  currentSessionId?: string; // 👈 CRITICAL: Added for device restriction
  lastLogin?: Date;          // 👈 Added for "User should see last login"
}

export const sendTokens = (res: Response, user: TokenUser) => {
  /* 1️⃣ PASS SESSION ID TO GENERATOR
     Ensure your generateTokens() service is updated to accept 
     this 3rd argument and embed it into the JWT payload.
  */
  const { accessToken, refreshToken } = generateTokens(
    user.id, 
    user.role, 
    user.currentSessionId // 👈 Pass this to the service
  );

  const isProduction = env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
  };

  /* ---------- 🍪 BROWSER COOKIES ---------- */
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ms(env.JWT_ACCESS_EXPIRES_IN as StringValue),
    path: "/",
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: ms(env.JWT_REFRESH_EXPIRES_IN as StringValue),
    // Updated path to ensure refresh works across auth routes
    path: "/api/v1/auth", 
  });

  /* ---------- 📦 JSON RESPONSE ---------- */
  res.status(200).json({
    success: true,
    user: {
      _id: user.id,
      pj: user.pj,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin, // 👈 Frontend can now show: "Your last login was..."
    },
    // Sending tokens for Mobile/Expo compatibility
    accessToken,
    refreshToken,
  });
};