import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, AUTH_MAX_AGE } from "./backend";

/** Server-side cookie read (TS glitch safe) */
export function getAuthToken(): string | undefined {
  // TS typing glitch avoid: cast to any
  const store: any = cookies();
  return store.get?.(AUTH_COOKIE)?.value as string | undefined;
}

/** Set token (Route Handler only) */
export function setAuthCookieOnResponse(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
}

/** Clear token (Route Handler only) */
export function clearAuthCookieOnResponse(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
