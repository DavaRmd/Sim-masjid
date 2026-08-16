interface FooterProps {
  namaMasjid: string;
  alamat: string;
}

export default function Footer({ namaMasjid, alamat }: FooterProps) {
  const tahun = new Date().getFullYear();

  return (
    <footer className="bg-[#0A2E1F]">
      {/* Quran verse accent */}
      <div className="border-b border-white/10 py-6 text-center">
        <p className="font-serif text-2xl leading-relaxed text-[#D4AF37]/80 italic">
          إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ
        </p>
        <p className="mt-1 text-xs font-medium tracking-wider text-white/40">
          QS. At-Taubah: 18
        </p>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-2 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="text-base font-bold text-white">{namaMasjid}</p>
            <p className="mt-1 text-sm text-[#8D9F96]">{alamat}</p>
          </div>
          <p className="text-xs text-white/40">
            &copy; {tahun} SIM Masjid · Hak cipta dilindungi
          </p>
        </div>
      </div>
    </footer>
  );
}