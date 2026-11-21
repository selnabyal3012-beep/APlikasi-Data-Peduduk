import { ChangeEvent, useState } from 'react';
import {
  Check,
  Download,
  FileSpreadsheet,
  FolderOpen,
  Printer,
  Trash2,
  Upload,
} from 'lucide-react';
import { Resident, VillageProfile } from '../types/population';
import {
  CsvParseResult,
  TEMPLATE_HEADERS,
  TEMPLATE_LABELS_ID,
  downloadEmptyCsvTemplate,
  downloadEmptyExcelTemplate,
  exportJsonBackup,
  exportResidentsToCsv,
  exportResidentsToExcel,
  parseCsvResidents,
} from '../lib/csvAndExcel';

interface TemplatesAndBackupViewProps {
  residents: Resident[];
  profile: VillageProfile;
  onImportResidents: (newResidents: Resident[], mode: 'merge' | 'replace') => void;
  onRestoreBackup: (residents: Resident[], profile?: VillageProfile) => void;
  onClearAll: () => void;
  onPrintBlankTemplate: () => void;
}

export function TemplatesAndBackupView({
  residents,
  profile,
  onImportResidents,
  onRestoreBackup,
  onClearAll,
  onPrintBlankTemplate,
}: TemplatesAndBackupViewProps) {
  const [csvPreview, setCsvPreview] = useState<CsvParseResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [confirmClear, setConfirmClear] = useState(false);

  function handleCsvUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const parsed = parseCsvResidents(text);
      setCsvPreview(parsed);
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', text: 'Gagal membaca berkas CSV dari perangkat.' });
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  function handleApplyCsvImport() {
    if (!csvPreview || csvPreview.validRows.length === 0) return;
    onImportResidents(csvPreview.validRows, importMode);
    setFeedback({
      type: 'success',
      text: `${csvPreview.validRows.length} data penduduk berhasil disimpan ke database offline.`,
    });
    setCsvPreview(null);
  }

  function handleJsonRestore(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? '{}')) as {
          residents?: Resident[];
          villageProfile?: VillageProfile;
        };
        if (!Array.isArray(parsed.residents)) {
          setFeedback({
            type: 'error',
            text: 'Berkas cadangan JSON tidak valid (daftar penduduk tidak ditemukan).',
          });
          return;
        }
        onRestoreBackup(parsed.residents, parsed.villageProfile);
        setFeedback({
          type: 'success',
          text: `Berhasil memulihkan ${parsed.residents.length} data penduduk dari berkas cadangan JSON.`,
        });
      } catch {
        setFeedback({ type: 'error', text: 'Berkas JSON rusak atau tidak dapat dibaca.' });
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 px-4 py-3 text-sm rounded-xl border ${
            feedback.type === 'success'
              ? 'btn-accent-soft'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
          }`}
        >
          {feedback.type === 'success' && <Check className="w-4 h-4 shrink-0 text-accent" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Bagian 1: Template Kosong Siap Pakai */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            01. Template Kosong Data Penduduk Desa
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Unduh template kosong di bawah ini untuk diisi secara manual oleh perangkat desa atau
            ketua RT/RW, baik di komputer (Excel/LibreOffice) maupun dicetak di kertas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Template Kosong Excel (.xls)
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Berisi 50 baris kosong dengan 21 kolom standar Buku Induk. Kolom NIK & No. KK sudah
                diformat Teks agar 16 digit tidak berubah menjadi angka ilmiah di Excel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadEmptyExcelTemplate(profile, 50)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg btn-accent whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Unduh Template Excel (.xls)
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Template Kosong CSV (.csv)
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Format CSV kosong (25 baris) dengan pemisah titik koma (;) agar langsung dapat
                diunggah kembali ke aplikasi setelah diisi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadEmptyCsvTemplate(25)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Unduh Template CSV (.csv)
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Formulir Kertas Kosong
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Cetak langsung lembar Buku Induk Penduduk kosong (15 baris bernomor) untuk
                pendataan manual pintu ke pintu menggunakan pulpen.
              </p>
            </div>
            <button
              type="button"
              onClick={onPrintBlankTemplate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Cetak Formulir Kosong
            </button>
          </div>
        </div>

        {/* Rincian Struktur Kolom Template */}
        <details className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/70 dark:bg-slate-800/40">
          <summary className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
            Lihat Daftar 21 Kolom pada Template Kosong
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {TEMPLATE_HEADERS.map((h, idx) => (
              <div key={h} className="flex items-baseline gap-2 text-slate-700 dark:text-slate-300">
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                  {h}
                </span>
                <span className="text-slate-500 dark:text-slate-400 truncate">
                  — {TEMPLATE_LABELS_ID[h]}
                </span>
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* Bagian 2: Impor Data dari Template CSV */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            02. Impor Data dari Berkas CSV
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Jika Anda mengisi data menggunakan Template Kosong CSV (atau menyimpan file Excel ke
            format CSV UTF-8), unggah berkasnya di sini untuk dimasukkan ke database lokal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg btn-accent cursor-pointer whitespace-nowrap">
            <Upload className="w-4 h-4" />
            Pilih Berkas CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvUpload}
              className="sr-only"
            />
          </label>

          <div className="flex items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
              />
              Tambahkan / Perbarui berdasarkan NIK
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
              />
              Ganti Seluruh Data Saat Ini
            </label>
          </div>
        </div>

        {csvPreview && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="space-x-3">
                <span className="font-semibold text-accent">
                  Siap diimpor: {csvPreview.validRows.length} baris
                </span>
                {csvPreview.errors.length > 0 && (
                  <span className="font-semibold text-red-700 dark:text-red-400">
                    Baris bermasalah: {csvPreview.errors.length}
                  </span>
                )}
                {csvPreview.skippedEmptyRows > 0 && (
                  <span className="text-slate-500 dark:text-slate-400">
                    Baris kosong dilewati: {csvPreview.skippedEmptyRows}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCsvPreview(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                {csvPreview.validRows.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyCsvImport}
                    className="px-3 py-1.5 text-xs font-medium rounded-md btn-accent"
                  >
                    Simpan {csvPreview.validRows.length} Penduduk
                  </button>
                )}
              </div>
            </div>

            {csvPreview.errors.length > 0 && (
              <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                {csvPreview.errors.map((err, i) => (
                  <li key={i}>
                    Baris {err.rowNumber}: {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Bagian 3: Ekspor Data & Cadangan Offline */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            03. Ekspor Data & Cadangan Offline (Backup / Restore)
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Simpan salinan data penduduk ke folder komputer atau flashdisk secara berkala agar aman
            bila peramban dibersihkan atau pindah komputer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={residents.length === 0}
            onClick={() => exportResidentsToExcel(residents, profile)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-accent" />
            Ekspor Semua ke Excel (.xls)
          </button>

          <button
            type="button"
            disabled={residents.length === 0}
            onClick={() => exportResidentsToCsv(residents)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Ekspor Semua ke CSV
          </button>

          <button
            type="button"
            onClick={() => exportJsonBackup(residents, profile)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Simpan Cadangan Offline (.json)
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap">
            <FolderOpen className="w-4 h-4" />
            Pulihkan Cadangan (.json)
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleJsonRestore}
              className="sr-only"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Kosongkan Buku Induk
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menghapus semua data penduduk dari penyimpanan lokal untuk kembali ke kondisi template
              kosong.
            </p>
          </div>

          {!confirmClear ? (
            <button
              type="button"
              disabled={residents.length === 0}
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 disabled:opacity-50 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              Kosongkan Semua Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setConfirmClear(false);
                  setFeedback({
                    type: 'success',
                    text: 'Seluruh data penduduk telah dikosongkan. Aplikasi kembali ke template kosong.',
                  });
                }}
                className="px-3 py-2 text-xs font-medium text-white bg-red-700 rounded-lg hover:bg-red-800"
              >
                Ya, Hapus Permanen ({residents.length} data)
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
