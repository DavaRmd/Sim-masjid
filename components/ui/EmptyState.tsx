import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  judul: string;
  deskripsi: string;
  aksiLabel?: string;
  aksiHref?: string;
}

export default function EmptyState({
  icon: Icon,
  judul,
  deskripsi,
  aksiLabel,
  aksiHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6]">
        <Icon className="h-8 w-8 text-[#9CA3AF]" />
      </div>
      <p className="text-base font-semibold text-[#1A1A1A]">{judul}</p>
      <p className="mt-1 max-w-[320px] text-sm text-[#6B7280]">{deskripsi}</p>
      {aksiLabel && aksiHref && (
        <Link href={aksiHref} className="mt-5">
          <Button className="bg-[#346739] hover:bg-[#2A5230] text-white">
            {aksiLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}