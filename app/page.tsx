import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/mdx";

export default async function Home() {
  const allPosts = await getAllPosts();
  const recentPosts = allPosts.slice(0, 3);
  return (
    <div className="max-w-7xl mx-auto space-y-10 p-6 lg:p-12 pb-20">
      {/* Hero / Summary Widget */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface-container rounded-xl p-8 border-l-2 border-primary shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter text-on-surface mb-2">Systems Operational.</h1>
                <p className="text-on-surface-variant font-mono text-sm tracking-tight uppercase">Today Summary Widget</p>
              </div>
              <div className="bg-secondary/10 text-secondary px-4 py-2 rounded-sm border border-secondary/20 flex flex-col items-end">
                <span className="font-mono text-xs font-bold uppercase tracking-widest">Daily PnL</span>
                <span className="text-2xl font-mono font-bold">+$420.00</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="bg-surface-container-low px-4 py-2 rounded-sm border border-outline-variant/30 flex-1 sm:flex-none">
                  <span className="block font-mono text-[10px] uppercase text-on-surface-variant">Trades Executed</span>
                  <span className="text-xl font-mono font-medium">05</span>
                </div>
                <div className="bg-surface-container-low px-4 py-2 rounded-sm border border-outline-variant/30 flex-1">
                  <span className="block font-mono text-[10px] uppercase text-on-surface-variant">Model Insight</span>
                  <p className="text-sm font-body text-on-surface">Positive momentum in the AI model, slight pullback in volatility.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors"></div>
        </div>

        {/* Live Feed / Status */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 flex flex-col gap-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span> Terminal Log
          </h3>
          <div className="flex-1 font-mono text-[11px] space-y-2 text-on-surface-variant/80 overflow-hidden">
            <p><span className="text-primary-dim">[08:42:12]</span> ETH-PERP position opened at $2,421</p>
            <p><span className="text-primary-dim">[09:15:00]</span> Training epoch 42 completed (loss: 0.0014)</p>
            <p><span className="text-primary-dim">[10:02:45]</span> New travel entry: Kyoto reflections</p>
            <p><span className="text-primary-dim">[11:20:10]</span> API health check: 100% operational</p>
            <p><span className="text-secondary-dim">[12:00:01]</span> Daily profit target reached</p>
          </div>
          <button className="w-full py-2 bg-surface-container text-on-surface font-mono text-[10px] uppercase tracking-widest border border-outline-variant/20 hover:bg-surface-bright transition-colors cursor-pointer">
            Expand Terminal
          </button>
        </div>
      </section>

      {/* Category Navigation (Asymmetric Bento) */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Link href="/dev" className="md:col-span-4 group relative overflow-hidden bg-surface-container rounded-xl aspect-[4/3] border border-outline-variant/10 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-background mix-blend-luminosity"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 p-8 z-20">
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2 block">Engineering</span>
            <h2 className="text-3xl font-headline font-bold text-on-surface">Dev Log</h2>
            <p className="text-on-surface-variant text-sm mt-2 line-clamp-2">Building high-performance trading bots and full-stack architecture.</p>
          </div>
        </Link>
        <Link href="/trading" className="md:col-span-5 group relative overflow-hidden bg-surface-container rounded-xl aspect-[4/3] border border-outline-variant/10 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 p-8 z-20">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary mb-2 block">Markets</span>
            <h2 className="text-3xl font-headline font-bold text-on-surface">Trading</h2>
            <p className="text-on-surface-variant text-sm mt-2 line-clamp-2">Quantitative strategies, risk management, and market analysis.</p>
          </div>
        </Link>
        <Link href="/travel" className="md:col-span-3 group relative overflow-hidden bg-surface-container rounded-xl aspect-[4/3] md:aspect-auto border border-outline-variant/10 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 p-8 z-20">
            <span className="font-mono text-[10px] uppercase tracking-widest text-tertiary mb-2 block">Journal</span>
            <h2 className="text-3xl font-headline font-bold text-on-surface">Travel</h2>
            <p className="text-on-surface-variant text-sm mt-2 line-clamp-2">Records of life beyond the screen.</p>
          </div>
        </Link>
      </section>

      {/* Recent Posts Feed */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-outline-variant/10 pb-4">
          <h2 className="text-2xl font-headline font-bold">Recent Records</h2>
          <Link href="/archive" className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
            View All Posts
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts.length === 0 ? (
            <div className="md:col-span-3 py-12 text-center text-outline-variant font-mono text-sm uppercase">
               No recent records found in R2 database.
            </div>
          ) : (
            recentPosts.map(post => {
              const bgColors: Record<string, string> = {
                dev: "bg-primary-container/20 text-on-primary-container border-primary-container/30",
                trading: "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30",
                travel: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30"
              };
              const hoverColors: Record<string, string> = {
                dev: "group-hover:text-primary",
                trading: "group-hover:text-secondary",
                travel: "group-hover:text-tertiary"
              };

              const badgeColor = bgColors[post.category] || bgColors.dev;
              const titleHoverColor = hoverColors[post.category] || hoverColors.dev;

              return (
                <Link key={post.slug} href={`/${post.category}/${post.slug}`}>
                  <article className="group bg-surface-container rounded-lg p-6 hover:bg-surface-bright transition-all duration-200 flex flex-col gap-4 border border-transparent hover:border-outline-variant/20 h-full">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-wider border ${badgeColor}`}>
                        {post.category}
                      </span>
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{post.date}</span>
                    </div>
                    <h3 className={`text-xl font-headline font-semibold text-on-surface transition-colors ${titleHoverColor}`}>
                      {post.title}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{post.summary}</p>
                    <div className="flex gap-2 mt-auto">
                      {post.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="font-mono text-[10px] text-on-surface-variant uppercase">#{tag}</span>
                      ))}
                    </div>
                  </article>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
