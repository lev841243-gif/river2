const items = [
  'Licensed Captains',
  'Premium Fleet',
  'Private Cruises',
  'Instant Booking',
];

export default function HeroTrust() {
  return (
    <div className="absolute bottom-10 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
      <div className="flex items-center gap-5 rounded-full border border-white/10 bg-white/5 px-8 py-3 backdrop-blur-xl">
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-5">
            <span className="text-xs uppercase tracking-[0.25em] text-white/70">
              {item}
            </span>

            {index !== items.length - 1 && (
              <span className="h-1 w-1 rounded-full bg-[#C5A46D]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}