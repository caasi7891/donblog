import { getPostBySlug } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/mdx/CodeBlock";
import { StaticChart } from "@/components/mdx/StaticChart";
import Link from "next/link";
import fs from "fs/promises";
import path from "path";

// Support for standard SSG paths
export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), "content");
  const categories = ["dev", "trading", "travel"];
  let params: { category: string; slug: string }[] = [];

  for (const category of categories) {
    try {
      const dirPath = path.join(contentDir, category);
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file.endsWith(".mdx")) {
          params.push({ category, slug: file.replace(".mdx", "") });
        }
      }
    } catch (err) {
      // Missing category folder
    }
  }
  return params;
}

const components = {
  StaticChart,
  pre: CodeBlock,
};

export default async function PostPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const post = await getPostBySlug(category, slug);

  if (!post) {
    notFound();
  }

  const { metadata, content } = post;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12 min-h-screen">
      <article className="lg:col-span-8 space-y-10">
        <header className="space-y-6">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest text-primary">
            <Link href={`/${category}`} className="px-2 py-0.5 bg-primary-container text-on-primary-container rounded-sm uppercase hover:bg-primary hover:text-on-primary transition-colors">
              {category}
            </Link>
            <span className="text-outline-variant">•</span>
            <time dateTime={metadata.date}>{metadata.date}</time>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-headline leading-none tracking-tighter text-on-surface">
            {metadata.title}
          </h1>
          
          {metadata.summary && (
            <p className="text-xl text-on-surface-variant font-light leading-relaxed max-w-2xl">
              {metadata.summary}
            </p>
          )}

          {metadata.tags && metadata.tags.length > 0 && (
             <div className="flex flex-wrap gap-2">
               {metadata.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-surface-container text-on-surface-variant font-mono text-[10px] uppercase rounded-full">
                    #{tag}
                  </span>
               ))}
             </div>
          )}
        </header>

        {/* MDX Content Area */}
        <div className="prose prose-invert prose-lg max-w-none font-body text-on-surface-variant leading-relaxed space-y-6">
          <MDXRemote source={content} components={components} />
        </div>
      </article>

      <aside className="lg:col-span-4 space-y-8 hidden lg:block">
        <div className="sticky top-32 space-y-8">
           <section className="tonal-shift p-6 rounded-lg border border-white/5 space-y-4">
             <p className="text-xs text-on-surface-variant leading-relaxed">Subscribe to receive live trade alerts and terminal updates directly to your inbox.</p>
             <div className="space-y-3">
               <input type="email" placeholder="_ > enter email" className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 font-mono text-xs p-2 transition-colors" />
               <button className="w-full py-3 bg-primary text-on-primary font-mono text-xs uppercase tracking-widest font-bold rounded-sm hover:opacity-90 active:scale-95 transition-all">Execute Join Command</button>
             </div>
           </section>
        </div>
      </aside>
    </div>
  );
}
