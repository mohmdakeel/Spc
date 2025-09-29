import { NextRequest, NextResponse } from "next/server";
import { BACKEND } from "../_lib/backend";
import { setAuthCookieOnResponse } from "../_lib/cookies";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const backendRes = await fetch(`${BACKEND}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    const err = await backendRes.json().catch(() => ({}));
    return NextResponse.json(err || { ok: false, message: "Login failed" }, { status: backendRes.status });
  }

  const data = await backendRes.json(); // { token }
  const res = NextResponse.json({ ok: true });
  setAuthCookieOnResponse(res, data.token);
  return res;
}
