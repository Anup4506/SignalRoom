import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "pulse_session";
const SESSION_DURATION = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "local-development-secret-change-before-deploying";
  throw new Error("AUTH_SECRET is not configured");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createSession(username: string) {
  const payload = Buffer.from(JSON.stringify({ username, expiresAt: Date.now() + SESSION_DURATION * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function setSession(username: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, createSession(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { username: string; expiresAt: number };
    return data.expiresAt > Date.now() ? data : null;
  } catch {
    return null;
  }
}
