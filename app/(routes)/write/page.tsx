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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.email !== adminEmail && adminEmail) {
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
             setTags(data.tags || []);
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

  const addTag = (value: string) => {
    const cleaned = value.replace(/^#+/, "").trim().toLowerCase().replace(/\s+/g, "-");
    if (cleaned && !tags.includes(cleaned)) {
      setTags(prev => [...prev, cleaned]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

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
          tags,
          originalSlug: editSlug,
          originalCategory: editCategory 
        })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to upload");
      
      const msg = editSlug ? "Post updated successfully!" : "Post published successfully!";
      setSuccessMsg(msg);
      setTimeout(() => router.push(`/${category}/${data.slug}`), 1200);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-headline font-bold mb-8">{editSlug ? "Edit Post" : "Write a new post"}</h1>

      {successMsg && (
        <div className="mb-6 flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-5 py-4 text-sm font-semibold">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {successMsg} Redirecting…
        </div>
      )}
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

        {/* Hashtag Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Hashtags</label>
          <div className="min-h-[48px] w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all flex flex-wrap items-center gap-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full text-xs font-mono">
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-white transition-colors leading-none ml-0.5"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
              placeholder={tags.length === 0 ? "Type a tag and press Enter or Space..." : "Add more..."}
              className="flex-1 min-w-[180px] bg-transparent focus:outline-none text-sm placeholder:text-neutral-600"
            />
          </div>
          <p className="text-xs text-neutral-500">Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">Enter</kbd>, <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">Space</kbd>, or <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">,</kbd> to add. Backspace to remove last.</p>
        </div>

        <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Content (Markdown)</label>
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
