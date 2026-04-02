import Link from "next/link";
import clsx from "clsx";

export function SideNavBar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 hidden lg:flex flex-col border-r border-white/5 bg-[#131313] pt-20">
      <div className="px-6 py-4 mb-4">
        <h2 className="font-bold text-neutral-100 font-mono text-xs uppercase tracking-widest">System</h2>
        <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">v1.0.4-stable</p>
      </div>
      <nav className="flex-grow flex flex-col gap-1">
        <Link href="/" className="flex items-center gap-3 text-neutral-500 hover:text-neutral-300 hover:bg-white/5 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-200">
          <span className="material-symbols-outlined text-lg">dashboard</span> Dashboard
        </Link>
        <Link href="/dev" className="flex items-center gap-3 text-neutral-500 hover:text-neutral-300 hover:bg-white/5 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-200">
          <span className="material-symbols-outlined text-lg">terminal</span> Dev Log
        </Link>
        <Link href="/trading" className="flex items-center gap-3 text-neutral-500 hover:text-neutral-300 hover:bg-white/5 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-200">
          <span className="material-symbols-outlined text-lg">show_chart</span> Trading Terminal
        </Link>
        <Link href="/travel" className="flex items-center gap-3 text-neutral-500 hover:text-neutral-300 hover:bg-white/5 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-200">
          <span className="material-symbols-outlined text-lg">explore</span> Travel Journal
        </Link>
      </nav>
      <div className="p-4 mt-auto border-t border-white/5">
        <Link href="#" className="flex items-center gap-3 text-neutral-500 hover:text-neutral-300 px-4 py-2 font-mono text-[10px] uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">settings</span> Settings
        </Link>
        <Link href="#" className="flex items-center gap-3 text-neutral-500 hover:text-neutral-300 px-4 py-2 font-mono text-[10px] uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">help_outline</span> Support
        </Link>
      </div>
    </aside>
  );
}
