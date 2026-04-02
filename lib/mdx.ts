import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

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
    const fullPath = path.join(CONTENT_DIR, category, `${slug}.mdx`);
    const fileContents = await fs.readFile(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      metadata: { ...data, slug, category } as PostMetadata,
      content,
    };
  } catch (err) {
    return null;
  }
}

export async function getAllPosts(category?: string): Promise<PostMetadata[]> {
  try {
    const categories = category ? [category] : ["dev", "trading", "travel"];
    let posts: PostMetadata[] = [];

    for (const cat of categories) {
      const dirPath = path.join(CONTENT_DIR, cat);
      let fileNames: string[] = [];
      try {
        fileNames = await fs.readdir(dirPath);
      } catch (err) {
        // Ignore if dir doesn't exist
        continue;
      }

      for (const fileName of fileNames) {
        if (!fileName.endsWith(".mdx")) continue;
        
        const slug = fileName.replace(/\.mdx$/, "");
        const fullPath = path.join(dirPath, fileName);
        const fileContents = await fs.readFile(fullPath, "utf8");
        const { data } = matter(fileContents);

        posts.push({ ...data, slug, category: cat } as PostMetadata);
      }
    }

    // Sort descending by date
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err) {
    return [];
  }
}
