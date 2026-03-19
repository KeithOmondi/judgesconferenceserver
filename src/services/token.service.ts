import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { hashToken } from "../utils/hashToken";
import { saveRefreshToken } from "../models/refreshToken.store";
import ms, { StringValue } from "ms";

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate Access & Refresh tokens with secure refresh storage and session locking
 * @param userId - User unique ID
 * @param role - User role for access token
 * @param sessionId - Unique session ID to restrict to one device
 */
export const generateTokens = (
  userId: string, 
  role: string, 
  sessionId?: string // 👈 NEW: Added 3rd parameter
): Tokens => {
  
  // 1️⃣ Access token now contains sessionId for middleware validation
  const accessToken = jwt.sign(
    { id: userId, role, sessionId }, // 👈 Added sessionId
    env.JWT_SECRET as string,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
  );

  // 2️⃣ Refresh token also contains sessionId to prevent "refreshing" an old session
  const refreshToken = jwt.sign(
    { id: userId, sessionId }, // 👈 Added sessionId
    env.JWT_REFRESH_SECRET as string,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
  );

  // 3️⃣ Hash & store refresh token
  const tokenHash = hashToken(refreshToken);
  const refreshExpiry = new Date(
    Date.now() + ms(env.JWT_REFRESH_EXPIRES_IN as StringValue)
  );

  saveRefreshToken({
    userId,
    tokenHash,
    expiresAt: refreshExpiry,
    // If your refreshToken.store model supports it, 
    // you could also store the sessionId here for extra auditing.
  });

  // 4️⃣ Return tokens
  return { accessToken, refreshToken };
};