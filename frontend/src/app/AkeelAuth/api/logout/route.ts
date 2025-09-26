import { NextResponse } from "next/server";
import { clearAuthCookieOnResponse } from "../_lib/cookies";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookieOnResponse(res);
  return res;
}
