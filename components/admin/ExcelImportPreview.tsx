"use client";

import { useState, useRef } from "react";
import { X, Upload, Download, AlertCircle, CheckCircle2, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  parseExcelKeuangan,
  validasiRowExcel,
  generateTemplateExcel,
  ExcelRowKeuangan,
} from "@/lib/excel-helper";
import type { KasType, JenisKeuangan } from "@/types";

interface ExcelImportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "upload" | "preview" | "confirm";

interface RowWithStatus {
  row: ExcelRowKeuangan;
  valid: boolean;
  errorPesan?: string;
  nomorBaris: number;
}

export default function ExcelImportPreview({
  isOpen,
  onClose,
  onSuccess,
}: ExcelImportPreviewProps) {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<RowWithStatus[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      toast.error("Format file harus berupa Excel (.xlsx atau .xls)");
      return;
    }

    setIsParsing(true);

    try {
      // Parse Excel
      const parsedRows = await parseExcelKeuangan(selectedFile);
      
      if (parsedRows.length === 0) {
        toast.error("File Excel kosong atau header kolom tidak sesuai template");
        setIsParsing(false);
        return;
      }

      // Validasi baris demi baris
      const rowsWithValidation: RowWithStatus[] = parsedRows.map((r, idx) => {
        const nomorBaris = idx + 2; // Baris 1 biasanya header kolom di Excel
        const validation = validasiRowExcel(r, nomorBaris);
        return {
          row: r,
          valid: validation.valid,
          errorPesan: validation.pesan,
          nomorBaris,
        };
      });

      setRows(rowsWithValidation);
      setStep("preview");
    } catch (err) {
      toast.error("Gagal memproses berkas Excel", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleTemplateDownload = () => {
    try {
      generateTemplateExcel();
      toast.success("Template Excel berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh template Excel");
    }
  };

  const handleReset = () => {
    setRows([]);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("Tidak ada baris data valid yang bisa diimport");
      return;
    }

    setIsImporting(true);
    const supabase = createClient();

    try {
      // Payload mapping
      const payload = validRows.map((r) => {
        const kas = String(r.row.Kas || r.row["Kas"] || "").toLowerCase().trim();
        const jenis = String(r.row.Jenis || r.row["Jenis"] || "").toLowerCase().trim();
        const namaDonaturRaw = r.row["Nama Donatur"];

        return {
          tanggal: r.row.Tanggal,
          kas_type: kas as KasType,
          jenis: jenis as JenisKeuangan,
          kategori: String(r.row.Kategori || "").trim(),
          jumlah: Number(r.row.Jumlah),
          keterangan: r.row.Keterangan ? String(r.row.Keterangan).trim() : null,
          nama_donatur: kas === "renovasi" && jenis === "pemasukan"
            ? (String(namaDonaturRaw || "").trim() || "Hamba Allah")
            : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      // Batch Insert ke database
      const { error } = await supabase.from("keuangan").insert(payload);

      if (error) throw error;

      toast.success(`Berhasil mengimport ${payload.length} transaksi keuangan`);
      onSuccess();
      onClose();
      handleReset();
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengimport data", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const totalRows = rows.length;
  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = totalRows - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 bg-[#EAF2EB]">
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A]">
              Import Transaksi via Excel
            </h3>
            <p className="text-xs text-[#6B7280]">
              Unggah berkas spreadsheet keuangan (.xlsx / .xls) untuk import massal.
            </p>
          </div>
          <button
            onClick={() => {
              if (!isImporting) {
                onClose();
                handleReset();
              }
            }}
            disabled={isImporting}
            className="rounded-lg p-1 text-[#6B7280] hover:bg-black/5 disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center border-b border-[#F3F4F6] py-3 bg-[#FFFAF0]/50 text-xs font-semibold text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              step === "upload" ? "bg-[#346739] text-white" : "bg-[#EAF2EB] text-[#346739]"
            }`}>1</span>
            <span className={step === "upload" ? "text-[#346739]" : ""}>Upload Berkas</span>
            <span className="h-px w-8 bg-[#D1D5DB]" />
            
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              step === "preview" ? "bg-[#346739] text-white" : step === "confirm" ? "bg-[#EAF2EB] text-[#346739]" : "bg-gray-200 text-gray-400"
            }`}>2</span>
            <span className={step === "preview" ? "text-[#346739]" : ""}>Preview & Validasi</span>
            <span className="h-px w-8 bg-[#D1D5DB]" />
            
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              step === "confirm" ? "bg-[#346739] text-white" : "bg-gray-200 text-gray-400"
            }`}>3</span>
            <span className={step === "confirm" ? "text-[#346739]" : ""}>Konfirmasi</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white min-h-[300px]">
          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              {isParsing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 animate-spin text-[#346739]" />
                  <p className="text-sm font-semibold text-[#1A1A1A]">Membaca file Excel...</p>
                  <p className="text-xs text-[#6B7280]">Memproses baris data dan melakukan validasi struktur...</p>
                </div>
              ) : (
                <>
                  {/* Dropzone */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-lg rounded-2xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAF9] p-10 cursor-pointer transition-colors hover:border-[#346739] hover:bg-[#EAF2EB]/30 flex flex-col items-center gap-3"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF2EB] text-[#346739]">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">Drag & drop file Excel di sini</p>
                      <p className="text-xs text-[#6B7280] mt-1">atau klik untuk menelusuri berkas dari komputer Anda</p>
                    </div>
                    <span className="inline-block rounded bg-[#E5E7EB] px-2.5 py-1 text-[10px] font-semibold uppercase text-gray-500">
                      Format: .XLSX / .XLS
                    </span>
                  </div>

                  {/* Unduh Template */}
                  <div className="mt-8 text-center">
                    <p className="text-xs text-[#6B7280]">Belum mempunyai file template Excel?</p>
                    <button
                      type="button"
                      onClick={handleTemplateDownload}
                      className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#346739] px-4 py-2 text-xs font-semibold text-[#346739] transition-colors hover:bg-[#EAF2EB]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Unduh Template Excel
                    </button>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="grid grid-cols-3 gap-4 rounded-xl border border-[#E5E7EB] bg-[#FFFAF0] p-4 text-center">
                <div>
                  <p className="text-xs text-[#6B7280]">Total Data</p>
                  <p className="text-lg font-bold text-[#1A1A1A]">{totalRows} Baris</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Data Valid ✅</p>
                  <p className="text-lg font-bold text-[#16A34A]">{validCount} Baris</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Data Error ❌</p>
                  <p className="text-lg font-bold text-[#DC2626]">{invalidCount} Baris</p>
                </div>
              </div>

              {/* Error Alert Box */}
              {invalidCount > 0 && (
                <div className="flex gap-2.5 rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2] p-4 text-xs text-[#DC2626]">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Perhatian:</span> Terdapat {invalidCount} baris data yang mengandung kesalahan. Baris yang salah akan otomatis <span className="font-bold">dilewati (tidak diimport)</span>. Jika Anda ingin mengimport semuanya, perbaiki berkas Excel Anda terlebih dahulu lalu upload ulang.
                  </div>
                </div>
              )}

              {/* Table Preview */}
              <div className="overflow-hidden rounded-xl border border-[#D1D5DB] bg-white">
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#EAF2EB] font-semibold text-[#346739]">
                      <tr>
                        <th className="px-4 py-3 w-16">Baris</th>
                        <th className="px-4 py-3 w-20 text-center">Status</th>
                        <th className="px-4 py-3 w-28">Tanggal</th>
                        <th className="px-4 py-3 w-16">Kas</th>
                        <th className="px-4 py-3 w-20">Jenis</th>
                        <th className="px-4 py-3 w-24">Kategori</th>
                        <th className="px-4 py-3 w-24 text-right">Jumlah</th>
                        <th className="px-4 py-3 w-32">Keterangan</th>
                        <th className="px-4 py-3 w-28">Nama Donatur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {rows.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-gray-50 ${item.valid ? "" : "bg-[#FEF2F2]/40"}`}
                        >
                          <td className="px-4 py-2.5 text-[#6B7280] font-medium text-center">
                            {item.nomorBaris}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {item.valid ? (
                              <span className="inline-flex items-center gap-1 rounded bg-[#F0FDF4] px-1.5 py-0.5 font-bold text-[#16A34A]">
                                <CheckCircle2 className="h-3 w-3" /> OK
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 rounded bg-[#FEF2F2] px-1.5 py-0.5 font-bold text-[#DC2626] cursor-help"
                                title={item.errorPesan}
                              >
                                <AlertCircle className="h-3 w-3" /> Error
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-[#1A1A1A] whitespace-nowrap">
                            {item.row.Tanggal || "-"}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap uppercase">
                            {item.row.Kas || "-"}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap capitalize">
                            {item.row.Jenis || "-"}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {item.row.Kategori || "-"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                            {item.row.Jumlah ? new Intl.NumberFormat("id-ID").format(item.row.Jumlah) : "0"}
                          </td>
                          <td className="px-4 py-2.5 max-w-[150px] truncate text-[#6B7280]" title={item.row.Keterangan}>
                            {item.row.Keterangan || "-"}
                          </td>
                          <td className="px-4 py-2.5 max-w-[120px] truncate text-[#6B7280]" title={item.row["Nama Donatur"]}>
                            {item.row["Nama Donatur"] || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM */}
          {step === "confirm" && (
            <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF2EB] text-[#346739] mb-4">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h4 className="text-lg font-bold text-[#1A1A1A]">Konfirmasi Import Data</h4>
              <p className="text-sm text-[#6B7280] mt-2">
                Anda akan mengimport sebanyak <strong className="text-[#346739]">{validCount} baris data valid</strong> ke dalam basis data keuangan masjid.
              </p>
              {invalidCount > 0 && (
                <p className="text-xs text-[#DC2626] mt-2 font-semibold">
                  Catatan: {invalidCount} baris data yang error tidak akan diimport.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 border-t border-[#E5E7EB] p-6 bg-[#F9FAF9]">
          {step === "upload" && (
            <button
              onClick={onClose}
              disabled={isParsing}
              className="flex-1 rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
          )}

          {step === "preview" && (
            <>
              <button
                onClick={handleReset}
                className="flex-1 rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-gray-50"
              >
                Upload Ulang
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={validCount === 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#346739] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A5230] disabled:opacity-50"
              >
                Lanjutkan
                <Play className="h-3.5 w-3.5 fill-white" />
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <button
                onClick={() => setStep("preview")}
                disabled={isImporting}
                className="flex-1 rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || validCount === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#346739] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A5230] disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengimport...
                  </>
                ) : (
                  `Import ${validCount} Transaksi`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
