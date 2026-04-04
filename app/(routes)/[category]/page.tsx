import { getAllPosts } from "@/lib/mdx";
import { notFound } from "next/navigation";
import { CategoryPostList } from "@/components/CategoryPostList";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [
    { category: "dev" },
    { category: "trading" },
    { category: "travel" },
  ];
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  
  if (!["dev", "trading", "travel"].includes(category)) {
    notFound();
  }

  const posts = await getAllPosts(category);
  const featuredPost = posts.length > 0 ? posts[0] : null;
  const otherPosts = posts.length > 1 ? posts.slice(1) : [];

  const categoryTitles: Record<string, string> = {
    dev: "Dev Logs",
    trading: "Trading Journal",
    travel: "Travel Journal"
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 min-h-screen">
      {/* CategoryPostList renders both the header search bar and the post grid as a client component */}
      <CategoryPostList
        category={category}
        categoryTitle={categoryTitles[category] || category}
        featuredPost={featuredPost}
        otherPosts={otherPosts}
      />
    </div>
  );
}
