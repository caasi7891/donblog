import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique name
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `images/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const bucketName = process.env.R2_BUCKET_NAME || "";

    if (!bucketName) {
      return NextResponse.json({ error: "R2_BUCKET_NAME is not configured" }, { status: 500 });
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Build Public URL
    const baseUrl = process.env.NEXT_PUBLIC_R2_URL || process.env.R2_PUBLIC_URL_PREFIX || `https://pub-your-bucket-id.r2.dev`;
    const imageUrl = `${baseUrl.replace(/\/$/, '')}/${fileName}`;

    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error) {
    console.error("Error uploading image to R2:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
