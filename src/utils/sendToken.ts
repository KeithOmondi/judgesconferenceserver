import { Response } from "express";
import { generateTokens } from "../services/token.service";
import { env } from "../config/env";
import ms, { StringValue } from "ms";

interface TokenUser {
  id: string;               // internal DB _id
  pj: string;               
  name: string;
  email: string;
  role: string;
  currentSessionId?: string; // CRITICAL: Added for device restriction
  lastLogin?: Date;          
}

export const sendTokens = (res: Response, user: TokenUser) => {
  /* 1️⃣ PASS SESSION ID TO GENERATOR
      Ensure your generateTokens() service is updated to accept 
      this 3rd argument and embed it into the JWT payload.
  */
  const { accessToken, refreshToken } = generateTokens(
    user.id, 
    user.role, 
    user.currentSessionId 
  );

  const isProduction = env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    // Using 'none' in production requires 'secure: true' for cross-site (Render/Vercel)
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
  };

  /* ---------- 🍪 BROWSER COOKIES ---------- */
  
  // Access Token Cookie
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ms(env.JWT_ACCESS_EXPIRES_IN as StringValue),
    path: "/",
  });

  // Refresh Token Cookie
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: ms(env.JWT_REFRESH_EXPIRES_IN as StringValue),
    /** * FIXED: Changed path from "/api/v1/auth" to "/" 
     * This ensures the cookie is sent even if the refresh request 
     * comes from a different base path or internal route.
     **/
    path: "/", 
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
      lastLogin: user.lastLogin, 
    },
    // Tokens sent in body for mobile compatibility (Expo/React Native)
    accessToken,
    refreshToken,
  });
};