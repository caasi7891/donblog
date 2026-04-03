"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PostAdminActions({ category, slug }: { category: string; slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user || !adminEmail || user.email !== adminEmail) {
    return null;
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/detail?category=${category}&slug=${slug}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete post");
      router.push(`/${category}`);
    } catch (err: any) {
      alert("Error deleting post: " + err.message);
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/write?edit=${slug}&category=${category}`);
  };

  return (
    <div className="flex gap-3">
      <button 
        onClick={handleEdit}
        disabled={isDeleting}
        className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] uppercase tracking-widest rounded-sm transition-colors"
      >
        Edit
      </button>
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 font-mono text-[10px] uppercase tracking-widest rounded-sm transition-colors"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
