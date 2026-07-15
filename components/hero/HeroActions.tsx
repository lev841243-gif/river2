'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HeroActions() {
  return (
    <div className="mt-10 flex flex-col gap-4 sm:flex-row">
      <Link
        href="/booking"
        className="group inline-flex items-center justify-center rounded-full bg-[#C5A46D] px-8 py-4 text-sm font-semibold tracking-[0.15em] uppercase text-black transition-all duration-300 hover:scale-105 hover:bg-[#d8b47c]"
      >
        Book Experience
      </Link>

      <Link
        href="/experiences"
        className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-8 py-4 text-sm font-semibold tracking-[0.15em] uppercase text-white backdrop-blur-md transition-all duration-300 hover:border-white/50 hover:bg-white/10"
      >
        Explore Experiences

        <ArrowRight
          size={18}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}