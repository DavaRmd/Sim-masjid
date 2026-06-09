export default function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-[#D1D5DB] bg-white">
      {/* Image skeleton */}
      <div className="h-[180px] w-full bg-[#D1D5DB]" />

      {/* Content skeleton */}
      <div className="space-y-3 p-4">
        {/* Kategori badge */}
        <div className="h-5 w-20 rounded-full bg-[#D1D5DB]" />

        {/* Judul */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-[#D1D5DB]" />
          <div className="h-4 w-3/4 rounded bg-[#D1D5DB]" />
        </div>

        {/* Tanggal */}
        <div className="h-3 w-24 rounded bg-[#D1D5DB]" />

        {/* Ringkasan */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-[#D1D5DB]" />
          <div className="h-3 w-5/6 rounded bg-[#D1D5DB]" />
        </div>
      </div>
    </div>
  );
}