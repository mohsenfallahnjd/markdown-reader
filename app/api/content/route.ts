import { head } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    // verify blob exists and belongs to our store
    await head(url);
    const res = await fetch(url);
    const text = await res.text();
    return new NextResponse(text, { headers: { "Content-Type": "text/plain" } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
