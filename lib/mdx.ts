import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import matter from "gray-matter";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export interface PostMetadata {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags?: string[];
  summary?: string;
  thumbnail?: string;
}

export async function getPostBySlug(category: string, slug: string) {
  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) return null;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `${category}/${decodeURIComponent(slug)}.mdx`,
    });

    const response = await s3Client.send(command);
    if (!response.Body) return null;

    const fileContents = await response.Body.transformToString();
    const { data, content } = matter(fileContents);

    return {
      metadata: { ...data, slug, category } as PostMetadata,
      content,
    };
  } catch (err) {
    console.error("getPostBySlug R2 Error for", slug, ":", err);
    return null;
  }
}

export async function getAllPosts(category?: string): Promise<PostMetadata[]> {
  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      console.warn("R2_BUCKET_NAME not set");
      return [];
    }

    const categories = category ? [category] : ["dev", "trading", "travel"];
    let posts: PostMetadata[] = [];

    for (const cat of categories) {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${cat}/`,
      });

      const listResponse = await s3Client.send(listCommand);
      const objects = listResponse.Contents || [];

      for (const obj of objects) {
        if (!obj.Key || !obj.Key.endsWith(".mdx")) continue;
        
        const slug = obj.Key.split("/").pop()?.replace(/\.mdx$/, "") || "";
        
        try {
          const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: obj.Key,
          });

          const getResponse = await s3Client.send(getCommand);
          if (!getResponse.Body) continue;

          const fileContents = await getResponse.Body.transformToString();
          const { data } = matter(fileContents);

          posts.push({ ...data, slug, category: cat } as PostMetadata);
        } catch (e) {
             console.error("Failed downloading post:", obj.Key, e);
        }
      }
    }

    // Sort descending by date
    return posts.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  } catch (err) {
    console.error("getAllPosts R2 Error:", err);
    return [];
  }
}
