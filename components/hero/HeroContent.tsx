'use client';

import HeroActions from './HeroActions';

export default function HeroContent() {
  return (
    <div className="relative z-20 mx-auto flex w-full max-w-7xl px-6">
      <div className="max-w-3xl">

        <span className="mb-6 inline-block text-sm uppercase tracking-[0.35em] text-[#C5A46D]">
          Luxury Private Cruises
        </span>

        <h1 className="max-w-5xl text-5xl font-light leading-[0.95] text-white sm:text-6xl lg:text-8xl">
          Experience
          <br />
          Saint Petersburg
          <br />
          from the Water
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-white/75 lg:text-xl">
          Private luxury cruises crafted for unforgettable evenings on the
          Neva River. Discover bridge openings, romantic sunsets and exclusive
          experiences aboard our premium fleet.
        </p>

        <HeroActions />
      </div>
    </div>
  );
}