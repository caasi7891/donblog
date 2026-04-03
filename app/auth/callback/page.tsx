"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // onAuthStateChange inside AuthProvider will handle the actual
    // session storage, we just need to redirect the user to the home page
    // after the URL (with hash/code) has been evaluated by the Supabase client.
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || session) {
        router.push("/");
      }
    });

    // Fallback: forcefully redirect to home if no event triggers within a few seconds 
    // or if the URL has no auth payload.
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="flex justify-center items-center h-[70vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-400 font-mono text-sm tracking-widest uppercase animate-pulse">Completing Authentication...</p>
      </div>
    </div>
  );
}
