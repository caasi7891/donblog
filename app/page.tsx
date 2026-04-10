import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/mdx";
import { HomeRecentPosts } from "@/components/HomeRecentPosts";
import { TradingSummary } from "@/components/TradingSummary";

export default async function Home() {
  const allPosts = await getAllPosts();
  const recentPosts = allPosts.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-6 lg:p-12 pb-20">
      <TradingSummary />

      {/* Category Navigation (Asymmetric Bento) */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Link href="/dev" className="md:col-span-4 group relative overflow-hidden bg-surface-container rounded-xl aspect-[4/3] border border-outline-variant/10 hover:-translate-y-1 transition-all duration-300">
          <Image src="/dev_img.jpg" alt="Dev Log" fill priority sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-50 group-hover:opacity-65 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 p-8 z-20">
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2 block">Engineering</span>
            <h2 className="text-3xl font-headline font-bold text-on-surface">Dev Log</h2>
            <p className="text-on-surface-variant text-sm mt-2 line-clamp-2">Building high-performance trading bots and full-stack architecture.</p>
          </div>
        </Link>
        <Link href="/trading" className="md:col-span-4 group relative overflow-hidden bg-surface-container rounded-xl aspect-[4/3] border border-outline-variant/10 hover:-translate-y-1 transition-all duration-300">
          <Image src="/trading_img.jpg" alt="Trading" fill priority sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-50 group-hover:opacity-65 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 p-8 z-20">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary mb-2 block">Markets</span>
            <h2 className="text-3xl font-headline font-bold text-on-surface">Trading</h2>
            <p className="text-on-surface-variant text-sm mt-2 line-clamp-2">Quantitative strategies, risk management, and market analysis.</p>
          </div>
        </Link>
        
        <Link href="/travel" className="md:col-span-4 group relative overflow-hidden bg-surface-container rounded-xl aspect-[4/3] border border-outline-variant/10 hover:-translate-y-1 transition-all duration-300">
          <Image src="/travel_img.jpg" alt="Travel" fill priority sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-50 group-hover:opacity-65 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 p-8 z-20">
            <span className="font-mono text-[10px] uppercase tracking-widest text-tertiary mb-2 block">Journal</span>
            <h2 className="text-3xl font-headline font-bold text-on-surface">Travel</h2>
            <p className="text-on-surface-variant text-sm mt-2 line-clamp-2">Records of life beyond the screen.</p>
          </div>
        </Link>
      </section>

      {/* Recent Posts Feed */}
      <HomeRecentPosts posts={recentPosts} />
    </div>
  );
}
