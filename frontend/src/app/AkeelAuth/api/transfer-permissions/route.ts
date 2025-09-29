import { NextRequest, NextResponse } from "next/server";
import { BACKEND } from "../_lib/backend";
import { getAuthToken } from "..//_lib/cookies"; // NOTE path fix below

// NOTE: correct path is "../_lib/cookies"; if your editor auto-changes it, keep it as below:
import { getAuthToken as token } from "../_lib/cookies";
export async function POST(req: NextRequest) {
  const t = token();
  if (!t) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${BACKEND}/api/assign/transfer-permissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ message: text }, { status: res.status });
  }
}
