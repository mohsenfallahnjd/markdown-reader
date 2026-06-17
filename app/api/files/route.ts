import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  const { blobs } = await list({ prefix: "md-reader/" });

  const files = blobs.map((b) => ({
    url: b.url,
    name: b.pathname.replace(/^md-reader\/\d+-/, ""),
    uploadedAt: b.uploadedAt,
    size: b.size,
  }));

  return NextResponse.json(files.reverse());
}
