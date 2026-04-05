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
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

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
    fetchTemplates();
    
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

  const fetchTemplates = async () => {
    setIsTemplatesLoading(true);
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();
      if (Array.isArray(data)) setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setIsTemplatesLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!content.trim()) return alert("Content is empty. Write something to save as a template.");
    const name = prompt("Enter a name for this template:");
    if (!name) return;

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content })
      });
      if (response.ok) {
        alert("Template saved!");
        fetchTemplates();
      } else {
        throw new Error("Failed to save");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSelectTemplate = (templateContent: string) => {
    if (content.trim() && !confirm("This will replace your current content. Continue?")) return;
    setContent(templateContent);
    setShowTemplateDropdown(false);
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this template?")) return;
    try {
      const response = await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      if (response.ok) fetchTemplates();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

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
              <label className="text-sm font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                Content (Markdown)
              </label>
              <div className="flex items-center gap-3">
                {/* Template System */}
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="text-xs font-bold uppercase tracking-widest bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    Templates
                  </button>
                  
                  {showTemplateDropdown && (
                    <div className="absolute right-0 top-10 w-64 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 p-2 max-h-80 overflow-y-auto">
                      <div className="p-2 border-b border-white/5 mb-2 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-neutral-500">Saved Templates</span>
                        <button 
                          type="button"
                          onClick={handleSaveTemplate}
                          className="text-[10px] font-bold text-primary hover:underline uppercase"
                        >
                          + Save New
                        </button>
                      </div>
                      {templates.length === 0 ? (
                        <p className="text-xs text-neutral-600 p-4 text-center">No templates found.</p>
                      ) : (
                        <div className="space-y-1">
                          {templates.map(t => (
                            <div 
                              key={t.id}
                              onClick={() => handleSelectTemplate(t.content)}
                              className="group w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 text-left transition-colors cursor-pointer"
                            >
                              <span className="text-sm text-neutral-300 truncate pr-2">{t.name}</span>
                              <button 
                                onClick={(e) => handleDeleteTemplate(t.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 p-1"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-px h-6 bg-white/5 mx-1" />

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
                  className="text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">image</span>
                  {isUploadingImage ? "Uploading..." : "Add Image"}
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
