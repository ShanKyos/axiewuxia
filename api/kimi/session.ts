import * as jose from "jose";
import { env } from "../lib/env";
import type { SessionPayload } from "./types";

const JWT_ALG = "HS256";

// 1 năm là quá dài cho một session cookie không có cơ chế refresh/rotate — rút xuống 30 ngày
// (đủ cho trải nghiệm "đăng nhập một lần, chơi lâu dài" của game, giảm cửa sổ rủi ro nếu
// cookie bị lộ). Người dùng chỉ cần đăng nhập lại sau khi hết hạn, không mất save (save nằm
// trên DB/localStorage, không phụ thuộc session).
export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    console.warn("[session] No token provided for verification.");
    return null;
  }
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const { unionId, clientId } = payload;
    if (!unionId || !clientId) {
      console.warn("[session] JWT payload missing required fields.");
      return null;
    }
    return { unionId, clientId } as SessionPayload;
  } catch (error) {
    console.warn("[session] JWT verification failed:", error);
    return null;
  }
}
