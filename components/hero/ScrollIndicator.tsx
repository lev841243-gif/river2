export default function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center lg:bottom-16">
      <span className="mb-4 text-[11px] uppercase tracking-[0.35em] text-white/60">
        Discover Experiences
      </span>

      <div className="relative h-12 w-7 rounded-full border border-white/30">
        <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 animate-bounce rounded-full bg-[#C5A46D]" />
      </div>
    </div>
  );
}