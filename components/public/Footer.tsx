interface FooterProps {
  namaMasjid: string;
  alamat: string;
}

export default function Footer({ namaMasjid, alamat }: FooterProps) {
  const tahun = new Date().getFullYear();

  return (
    <footer className="bg-primary py-8 text-center">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
        <p className="text-base font-semibold text-white">{namaMasjid}</p>
        <p className="mt-1 text-sm text-white/80">{alamat}</p>
        <p className="mt-4 text-xs text-white/60">
          &copy; {tahun} SIM Masjid. Hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}