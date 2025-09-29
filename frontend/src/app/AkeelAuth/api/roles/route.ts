import { NextRequest, NextResponse } from "next/server";
import { BACKEND } from "../_lib/backend";
import { getAuthToken } from "../_lib/cookies";

export async function GET() {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${BACKEND}/api/roles`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const data = await res.json().catch(() => ([]));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${BACKEND}/api/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
