"use client";

import { useAuth } from "./AuthProvider";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Comment {
  id: string;
  user_email: string;
  user_name: string | null;
  user_avatar: string | null;
  body: string;
  created_at: string;
}

export function Comments({ postSlug }: { postSlug: string }) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("id, user_email, user_name, user_avatar, body, created_at")
      .eq("post_slug", postSlug)
      .order("created_at", { ascending: true });
    if (!error && data) setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("comments").insert({
      post_slug: postSlug,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      user_avatar: user.user_metadata?.avatar_url || null,
      body: comment.trim(),
    });

    if (!error) {
      setComment("");
      await fetchComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("comments").delete().eq("id", id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mt-16 pt-8 border-t border-white/10">
      <h2 className="text-2xl font-bold font-headline mb-8">
        Comments {!loading && comments.length > 0 && (
          <span className="text-lg font-normal text-on-surface-variant">({comments.length})</span>
        )}
      </h2>

      {/* Comment form */}
      {!user ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center mb-10">
          <span className="material-symbols-outlined text-4xl text-neutral-500 mb-4 block">lock</span>
          <h3 className="text-lg font-semibold mb-2">Join the conversation</h3>
          <p className="text-neutral-400 mb-6 font-body text-sm">Please sign in to write comments and interact with this post.</p>
          <Link href="/login" className="inline-block bg-white text-black font-semibold px-6 py-2 rounded-full hover:bg-neutral-200 transition-colors">
            Sign In with Google
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="flex items-start gap-4">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="You" className="w-10 h-10 rounded-full border border-white/20 flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                {user.email?.[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 min-h-[100px] resize-y transition-all"
                required
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!comment.trim() || submitting}
                  className="bg-primary text-on-primary px-5 py-2 text-sm font-semibold rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-neutral-500 italic">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex items-start gap-4 group">
              {c.user_avatar ? (
                <img src={c.user_avatar} alt={c.user_name || c.user_email} className="w-9 h-9 rounded-full border border-white/20 flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-sm flex-shrink-0 text-on-surface-variant">
                  {(c.user_name || c.user_email)[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-on-surface">
                    {c.user_name || c.user_email.split("@")[0]}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant">{formatDate(c.created_at)}</span>
                  {user?.id && c.user_email === user.email && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="ml-auto text-[10px] font-mono text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
