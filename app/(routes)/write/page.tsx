"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function WritePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div></div>}>
      <WritePageInner />
    </Suspense>
  )
}

function WritePageInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");
  const editCategory = searchParams.get("category");
  
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

  useEffect(() => {
    if (editSlug && editCategory) {
      fetch(`/api/posts/detail?category=${editCategory}&slug=${editSlug}`)
        .then(res => res.json())
        .then(data => {
           if (data.success) {
             setTitle(data.title || "");
             setContent(data.content || "");
             setCategory(editCategory);
           }
        })
        .catch(err => console.error("Failed to fetch post for edit", err));
    }
  }, [editSlug, editCategory]);

  if (loading || !user || (adminEmail && user.email !== adminEmail)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to upload image");
      
      const imageUrl = data.url;
      setContent(prev => prev + `\n![${file.name}](${imageUrl})\n`);
    } catch (err: any) {
      alert("Image upload error: " + err.message);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          category, 
          content,
          originalSlug: editSlug,
          originalCategory: editCategory 
        })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to upload");
      
      alert(`Post successfully uploaded to R2 at ${data.filePath}!`);
      router.push(`/${category}/${data.slug}`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-headline font-bold mb-8">{editSlug ? "Edit Post" : "Write a new post"}</h1>
      
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">CONTENT(MARKDOWN)</label>
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isUploadingImage ? "Uploading..." : "+ Add Image"}
                </button>
              </div>
            </div>
            <div data-color-mode="dark" className="w-full">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height={500}
                className="w-full border border-white/10 rounded-xl overflow-hidden shadow-none focus-within:border-primary transition-all"
              />
            </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isSubmitting} className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {editSlug ? "Update Post" : "Publish Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
