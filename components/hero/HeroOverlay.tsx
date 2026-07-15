export default function HeroOverlay() {
  return (
    <>
      {/* Основное затемнение */}
      <div className="absolute inset-0 -z-20 bg-black/45" />

      {/* Верхний градиент */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-black/70 via-transparent to-black/60" />

      {/* Левая виньетка */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_left,rgba(0,0,0,0.45),transparent_55%)]" />

      {/* Правая синяя подсветка */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_right,rgba(16,35,62,0.35),transparent_45%)]" />
    </>
  );
}