import { getAllPosts } from "@/lib/mdx";
import { ArchiveList } from "@/components/ArchiveList";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const allPosts = await getAllPosts();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 min-h-screen">
      <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <ArchiveList posts={allPosts} />
      </Suspense>
    </div>
  );
}
