import { NextRequest, NextResponse } from "next/server";
import { BACKEND } from "../_lib/backend";
import { getAuthToken } from "../_lib/cookies";

export async function GET(req: NextRequest) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const page = url.searchParams.get("page") ?? "0";
  const size = url.searchParams.get("size") ?? "20";
  const sort = url.searchParams.get("sort") ?? "username,asc";

  const res = await fetch(`${BACKEND}/api/users?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}&q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${BACKEND}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
