import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Fetch data profil masjid
  const { data: profil } = await supabase
    .from("profil_masjid")
    .select("nama_masjid, alamat")
    .limit(1)
    .single();

  const namaMasjid = profil?.nama_masjid ?? "Masjid";
  const alamat = profil?.alamat ?? "Alamat Masjid";

  return (
    <>
      <Navbar namaMasjid={namaMasjid} />
      <main className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
        {children}
      </main>
      <Footer namaMasjid={namaMasjid} alamat={alamat} />
    </>
  );
}