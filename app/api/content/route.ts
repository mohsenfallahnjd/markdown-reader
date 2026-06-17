import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });
    if (!res.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const text = await res.text();
    return new NextResponse(text, { headers: { "Content-Type": "text/plain" } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
