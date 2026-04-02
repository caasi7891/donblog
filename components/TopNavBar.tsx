import Link from "next/link";

export function TopNavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0b0b0b]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter text-neutral-100 font-headline">
            Building DonEngine
          </Link>
          <div className="hidden md:flex space-x-8 font-headline tracking-tight items-center">
            <Link href="/dev" className="text-neutral-500 hover:text-neutral-300 transition-colors">Dev</Link>
            <Link href="/trading" className="text-neutral-500 hover:text-neutral-300 transition-colors">Trading</Link>
            <Link href="/travel" className="text-neutral-500 hover:text-neutral-300 transition-colors">Travel</Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="material-symbols-outlined text-neutral-100 p-2 hover:bg-white/5 transition-all duration-150 rounded-full scale-98 active:scale-95">
            search
          </button>
          <button className="material-symbols-outlined text-neutral-100 p-2 hover:bg-white/5 transition-all duration-150 rounded-full scale-98 active:scale-95">
            account_circle
          </button>
        </div>
      </div>
    </nav>
  );
}
