import { Response } from "express";
import { generateTokens } from "../services/token.service";
import { env } from "../config/env";
import ms, { StringValue } from "ms";

interface TokenUser {
  id: string;
  pj: string;               
  name: string;
  email: string;
  role: string;
  currentSessionId?: string;
  lastLogin?: Date;          
}

export const sendTokens = (res: Response, user: TokenUser) => {
  const { accessToken, refreshToken } = generateTokens(
    user.id, 
    user.role, 
    user.currentSessionId 
  );

  const isProduction = env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    partitioned: isProduction, // 👈 fixes Safari ITP (CHIPS)
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
    accessToken,
    refreshToken,
  });
};