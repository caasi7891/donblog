"use client";

import { useAuth } from "./AuthProvider";
import { useState } from "react";
import Link from "next/link";

export function Comments({ postSlug }: { postSlug: string }) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // Scaffold functionality for later DB integration
    alert("Comment feature is pending database integration. You wrote: " + comment);
    setComment("");
  };

  return (
    <div className="mt-16 pt-8 border-t border-white/10">
      <h2 className="text-2xl font-bold font-headline mb-8">Comments</h2>
      
      {!user ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
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
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
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
                  disabled={!comment.trim()}
                  className="bg-neutral-100 text-black px-5 py-2 text-sm font-semibold rounded-full hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Scaffold: Existing comments list empty space */}
      <div className="space-y-6">
        <p className="text-sm text-neutral-500 italic">No comments yet. Be the first to share your thoughts!</p>
      </div>
    </div>
  );
}
