import Link from "next/link";
import Image from "next/image";

export default function Home() {
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
          <article className="bg-surface-container rounded-lg p-6 hover:bg-surface-bright transition-all duration-200 flex flex-col gap-4 border border-transparent hover:border-outline-variant/20 cursor-pointer">
            <div className="flex justify-between items-start">
              <span className="bg-primary-container/20 text-on-primary-container px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-wider border border-primary-container/30">Dev</span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Oct 24, 2023</span>
            </div>
            <h3 className="text-xl font-headline font-semibold text-on-surface group-hover:text-primary transition-colors">Optimizing Vector Database Queries for Sentiment Analysis</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Refining the retrieval pipeline to reduce latency in real-time news processing by 40% using Pinecone namespaces.</p>
            <div className="flex gap-2 mt-auto">
              <span className="font-mono text-[10px] text-on-surface-variant">#ai</span>
              <span className="font-mono text-[10px] text-on-surface-variant">#python</span>
            </div>
          </article>
          
          <article className="bg-surface-container rounded-lg p-6 hover:bg-surface-bright transition-all duration-200 flex flex-col gap-4 border border-transparent hover:border-outline-variant/20 cursor-pointer">
            <div className="flex justify-between items-start">
              <span className="bg-secondary-container/20 text-on-secondary-container px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-wider border border-secondary-container/30">Trading</span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Oct 22, 2023</span>
            </div>
            <h3 className="text-xl font-headline font-semibold text-on-surface group-hover:text-secondary transition-colors">Handling Black Swan Events in Automated Liquidities</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">How my model behaved during the recent volatility spike and why circuit breakers are your best friend.</p>
            <div className="flex gap-2 mt-auto">
              <span className="font-mono text-[10px] text-on-surface-variant">#crypto</span>
            </div>
          </article>

          <article className="bg-surface-container rounded-lg p-6 hover:bg-surface-bright transition-all duration-200 flex flex-col gap-4 border border-transparent hover:border-outline-variant/20 cursor-pointer">
            <div className="flex justify-between items-start">
              <span className="bg-tertiary-container/20 text-on-tertiary-container px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-wider border border-tertiary-container/30">Travel</span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Oct 15, 2023</span>
            </div>
            <h3 className="text-xl font-headline font-semibold text-on-surface group-hover:text-tertiary transition-colors">The Silence of Hokkaido: A Solo Drive Diary</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Escaping the terminal for 7 days to drive through the northern landscapes of Japan during autumn peak.</p>
            <div className="flex gap-2 mt-auto">
              <span className="font-mono text-[10px] text-on-surface-variant">#japan</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
