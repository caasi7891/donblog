import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(req: NextRequest) {
  try {
    const { title, category, content, originalSlug, originalCategory } = await req.json();

    if (!title || !category || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create a slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const date = new Date().toISOString();

    // Construct MDX with frontmatter
    const mdxContent = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
---

${content}`;

    const filePath = `${category}/${slug}.mdx`;
    const bucketName = process.env.R2_BUCKET_NAME || "";

    if (!bucketName) {
      return NextResponse.json({ error: "R2_BUCKET_NAME is not configured" }, { status: 500 });
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: mdxContent,
      ContentType: "text/markdown",
    });

    await s3Client.send(command);

    if (originalSlug && originalCategory) {
      const oldFilePath = `${originalCategory}/${originalSlug}.mdx`;
      if (oldFilePath !== filePath) {
        try {
          await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: oldFilePath }));
        } catch (delError) {
          console.error("Cleanup error on rename:", delError);
        }
      }
    }

    return NextResponse.json({ success: true, slug, filePath });
  } catch (error) {
    console.error("Error uploading to R2:", error);
    return NextResponse.json({ error: "Failed to upload post to R2" }, { status: 500 });
  }
}
