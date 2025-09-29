import { NextRequest, NextResponse } from "next/server";
import { BACKEND } from "../../_lib/backend";
import { getAuthToken } from "../../_lib/cookies";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${BACKEND}/api/users/${params.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${BACKEND}/api/users/${params.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ message: text }, { status: res.status });
  }
}
