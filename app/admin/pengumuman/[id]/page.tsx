import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PengumumanForm from "@/components/admin/PengumumanForm";
import type { Pengumuman } from "@/types";

interface EditPengumumanPageProps {
  params: { id: string };
}

export default async function EditPengumumanPage({ params }: EditPengumumanPageProps) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pengumuman")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!data) {
    notFound();
  }

  return <PengumumanForm mode="edit" dataAwal={data as Pengumuman} />;
}