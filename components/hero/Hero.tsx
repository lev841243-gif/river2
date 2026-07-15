'use client';

import HeroBackground from './HeroBackground';
import HeroOverlay from './HeroOverlay';
import HeroContent from './HeroContent';
import HeroTrust from './HeroTrust';
import HeroStats from './HeroStats';
import ScrollIndicator from './ScrollIndicator';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Background Video / Image */}
      <HeroBackground />

      {/* Dark overlays */}
      <HeroOverlay />

      {/* Main Content */}
      <HeroContent />

      {/* Bottom Trust Bar */}
      <HeroTrust />

      {/* Floating Stats */}
      <HeroStats />

      {/* Scroll Indicator */}
      <ScrollIndicator />
    </section>
  );
}