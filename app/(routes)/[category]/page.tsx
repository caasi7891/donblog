import { getAllPosts } from "@/lib/mdx";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return [
    { category: "dev" },
    { category: "trading" },
    { category: "travel" },
  ];
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  
  if (!["dev", "trading", "travel"].includes(category)) {
    notFound();
  }

  const posts = await getAllPosts(category);
  const featuredPost = posts.length > 0 ? posts[0] : null;
  const otherPosts = posts.length > 1 ? posts.slice(1) : [];

  const categoryTitles: Record<string, string> = {
    dev: "Dev Logs",
    trading: "Trading Journal",
    travel: "Travel Journal"
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 min-h-screen">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-mono text-primary text-xs tracking-[0.3em] uppercase mb-2">Repository Updates</div>
            <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tighter text-on-surface capitalize">
              {categoryTitles[category] || category}
            </h1>
          </div>
          
          <div className="w-full md:w-96">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant group-focus-within:text-primary transition-colors">terminal</span>
              <input type="text" placeholder={`_ > search ${category} logs`} className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-on-surface font-mono placeholder:text-neutral-600 pl-12 py-3 transition-all" />
            </div>
          </div>
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="py-20 text-center text-outline-variant font-mono text-sm uppercase">
          No records found in this category yet.
        </div>
      ) : (
        <>
          {featuredPost && (
            <section className="mb-12">
              <Link href={`/${category}/${featuredPost.slug}`} className="block group relative overflow-hidden rounded-xl bg-surface-container border border-white/5 hover:bg-surface-bright transition-all duration-300">
                <div className="aspect-[16/7] md:aspect-[21/9] w-full relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/80 to-transparent z-10"></div>
                  {/* Placeholder for real visual if thumbnail exists, else default gradient */}
                  <div className="w-full h-full object-cover opacity-40 mix-blend-luminosity group-hover:opacity-60 transition-opacity bg-primary/20"></div>
                </div>
                <div className="p-8 -mt-24 relative z-20">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-0.5 rounded-sm bg-primary-container text-on-primary-container text-[10px] font-mono font-bold">LATEST</span>
                    <span className="font-mono text-neutral-500 text-[10px] uppercase">{featuredPost.date}</span>
                  </div>
                  <h2 className="font-headline text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{featuredPost.title}</h2>
                  <p className="text-on-surface-variant text-sm max-w-2xl leading-relaxed mb-6">{featuredPost.summary}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                       {featuredPost.tags?.slice(0, 3).map(tag => (
                         <span key={tag} className="text-[10px] font-mono text-primary uppercase">#{tag}</span>
                       ))}
                    </div>
                    <span className="flex items-center gap-2 font-mono text-xs text-on-surface group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">link</span> READ
                    </span>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {otherPosts.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPosts.map(post => (
                 <Link key={post.slug} href={`/${category}/${post.slug}`} className="p-6 rounded-lg bg-surface-container hover:bg-surface-bright border border-white/5 transition-all duration-300 flex flex-col h-full -translate-y-0 hover:-translate-y-1 group">
                   <div className="flex justify-between items-start mb-6">
                     <div className="font-mono text-[10px] text-neutral-500 uppercase">{post.date}</div>
                     <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">description</span>
                   </div>
                   <h3 className="font-headline text-lg font-bold text-white mb-3 leading-tight group-hover:text-primary transition-colors">{post.title}</h3>
                   <p className="text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">{post.summary}</p>
                   
                   <div className="flex flex-wrap gap-2 mb-6">
                     {post.tags?.slice(0, 2).map(tag => (
                       <span key={tag} className="px-2 py-0.5 rounded-sm bg-surface-container-highest text-on-surface-variant text-[9px] font-mono uppercase">{tag}</span>
                     ))}
                   </div>
                   
                   <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                     <span className="text-[10px] font-mono text-primary uppercase tracking-tighter">Read Full Log</span>
                     <span className="material-symbols-outlined text-sm text-neutral-500 group-hover:text-white transition-colors">arrow_right_alt</span>
                   </div>
                 </Link>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
