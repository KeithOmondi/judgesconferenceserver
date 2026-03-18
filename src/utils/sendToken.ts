import { Response } from "express";
import { generateTokens } from "../services/token.service";
import { env } from "../config/env";
import ms, { StringValue } from "ms";

interface TokenUser {
  id: string; // This is the internal DB _id
  name: string;
  email: string;
  role: string;
}

export const sendTokens = (res: Response, user: TokenUser) => {
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  const isProduction = env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    // Mobile debug note: 'none' requires HTTPS. If testing on local IP, use 'lax'.
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
    path: "/api/v1/auth/refresh",
  });

  /* ---------- 📦 JSON RESPONSE ---------- */
  res.status(200).json({
    success: true,
    user: {
      _id: user.id, // 👈 Matched to your Redux interface 'User._id'
      name: user.name,
      email: user.email,
      role: user.role,
    },
    // 👈 IMPORTANT FOR MOBILE: 
    // Expo/Axios often cannot read httpOnly cookies.
    // Sending these here allows you to manually store them in SecureStore.
    accessToken,
    refreshToken,
  });
};