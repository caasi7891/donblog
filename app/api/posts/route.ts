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

/** Extract the first markdown image URL from content, e.g. ![alt](url) */
function extractFirstImage(content: string): string | null {
  const match = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  return match ? match[1] : null;
}

/** Generate a short unique ID: base-36 timestamp + 4 random chars */
function generateUniqueId(): string {
  const tsBase = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${tsBase}${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const { title, category, content, tags, originalSlug, originalCategory } = await req.json();

    if (!title || !category || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create a base slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // If editing an existing post, keep the original slug to preserve the URL.
    // For new posts, append a unique ID so same-title posts never overwrite each other.
    const slug = (originalSlug && originalCategory) ? originalSlug : `${baseSlug}-${generateUniqueId()}`;

    const date = new Date().toISOString();

    // Auto-detect thumbnail from first image in content
    const thumbnail = extractFirstImage(content);

    // Build frontmatter lines
    const frontmatterLines = [
      `title: "${title.replace(/"/g, '\\"')}"`,
      `date: "${date}"`,
    ];
    if (thumbnail) {
      frontmatterLines.push(`thumbnail: "${thumbnail}"`);
    }
    if (Array.isArray(tags) && tags.length > 0) {
      const tagList = tags.map((t: string) => `  - ${t}`).join("\n");
      frontmatterLines.push(`tags:\n${tagList}`);
    }

    // Construct MDX with frontmatter
    const mdxContent = `---
${frontmatterLines.join("\n")}
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
