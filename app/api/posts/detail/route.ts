import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import matter from "gray-matter";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const slug = searchParams.get("slug");

    if (!category || !slug) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "",
      Key: `${category}/${slug}.mdx`
    });

    await s3Client.send(command);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const slug = searchParams.get("slug");

    if (!category || !slug) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "",
      Key: `${category}/${slug}.mdx`
    });

    const response = await s3Client.send(getCommand);
    if (!response.Body) throw new Error("No body");
    
    const fileContents = await response.Body.transformToString();
    const { data, content } = matter(fileContents);

    return NextResponse.json({ success: true, title: data.title, content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
