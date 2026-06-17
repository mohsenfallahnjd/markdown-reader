import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file || !file.name.endsWith(".md")) {
    return NextResponse.json({ error: "Only .md files allowed" }, { status: 400 });
  }

  const blob = await put(`md-reader/${Date.now()}-${file.name}`, file, {
    access: "private",
    contentType: "text/plain",
  });

  return NextResponse.json({
    url: blob.url,
    name: file.name,
    uploadedAt: new Date().toISOString(),
    size: file.size,
  });
}
