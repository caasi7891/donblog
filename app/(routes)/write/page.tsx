"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WritePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("trading");
  const [content, setContent] = useState("");
  
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.email !== adminEmail && adminEmail) {
        // Not the admin
        router.push("/");
      }
    }
  }, [user, loading, router, adminEmail]);

  if (loading || !user || (adminEmail && user.email !== adminEmail)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Post creation pending database schema implementation!");
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-headline font-bold mb-8">Write a new post</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Post Title..."
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Category</label>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            >
              <option value="trading">Trading</option>
              <option value="dev">Dev</option>
              <option value="travel">Travel</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Content (MDX)</label>
           <textarea 
             value={content}
             onChange={e => setContent(e.target.value)}
             className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 min-h-[400px] font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
             placeholder="Write your MDX content here..."
             required
           />
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity">
            Publish Post
          </button>
        </div>
      </form>
    </div>
  );
}
