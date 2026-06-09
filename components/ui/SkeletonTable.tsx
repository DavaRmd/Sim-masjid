interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export default function SkeletonTable({
  rows = 5,
  cols = 5,
}: SkeletonTableProps) {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-[#D1D5DB] bg-white">
      {/* Header */}
      <div className="flex gap-4 border-b border-[#E5E7EB] bg-[#F9FAF9] px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="h-4 rounded bg-[#D1D5DB]"
            style={{ flex: i === 0 ? 1 : 1.5 }}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`r-${rowIdx}`}
          className={`flex gap-4 px-4 py-3 ${
            rowIdx < rows - 1 ? "border-b border-[#E5E7EB]" : ""
          }`}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={`c-${rowIdx}-${colIdx}`}
              className="h-4 rounded bg-[#D1D5DB]"
              style={{ flex: colIdx === 0 ? 1 : 1.5 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}