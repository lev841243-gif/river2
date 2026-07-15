'use client';

import Image from 'next/image';

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-30 overflow-hidden">
      {/* Видео подключим позже */}
      {/* <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/video/hero.mp4" type="video/mp4" />
      </video> */}

      {/* Временное изображение */}
      <Image
        src="/images/hero/hero.jpg"
        alt="Luxury boat on the Neva River"
        fill
        priority
        quality={100}
        className="object-cover scale-105 will-change-transform"
      />
    </div>
  );
}