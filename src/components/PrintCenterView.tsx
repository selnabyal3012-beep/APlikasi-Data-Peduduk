import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import {
  GENDER_OPTIONS,
  PrintMode,
  RESIDENCY_STATUS_OPTIONS,
  Resident,
  VillageProfile,
} from '../types/population';
import { AppSettings, PAPER_MARGIN_MM, PAPER_SIZE_CSS } from '../types/settings';
import { groupFamilies } from '../lib/demographics';
import { PrintOptions, PrintSheetContent } from './PrintViews';

interface PrintCenterViewProps {
  residents: Resident[];
  profile: VillageProfile;
  settings: AppSettings;
  onTriggerPrint: (
    mode: Exclude<PrintMode, 'none'>,
    filteredResidents: Resident[],
    options: PrintOptions
  ) => void;
}

const PRINT_FORMATS: {
  id: Exclude<PrintMode, 'none'>;
  title: string;
  desc: string;
}[] = [
  {
    id: 'rekap-semua',
    title: 'Rekapan Semua Data (Tak Terbatas)',
    desc: 'Tabel lengkap semua penduduk + 7 rekap demografi berkesinambungan antar halaman.',
  },
  {
    id: 'buku-induk',
    title: 'Buku Induk Penduduk',
    desc: 'Tabel daftar penduduk lengkap tanpa batas halaman dengan header berulang.',
  },
  {
    id: 'blank-template',
    title: 'Formulir Kosong (Kertas)',
    desc: 'Template kosong bernomor siap ditulis manual dengan pulpen.',
  },
  {
    id: 'kartu-keluarga',
    title: 'Rekap Kartu Keluarga',
    desc: 'Cetak semua KK atau pilih 1 Nomor KK tertentu.',
  },
  {
    id: 'biodata-individu',
    title: 'Biodata Perorangan',
    desc: 'Lembar biodata lengkap 1 warga beserta pas foto.',
  },
  {
    id: 'statistik',
    title: 'Laporan Statistik Desa',
    desc: 'Rekap jumlah penduduk, KK, dusun, umur, pendidikan, pekerjaan & agama.',
  },
];

export function PrintCenterView({
  residents,
  profile,
  settings,
  onTriggerPrint,
}: PrintCenterViewProps) {
  const [selectedMode, setSelectedMode] = useState<Exclude<PrintMode, 'none'>>(
    residents.length > 0 ? 'rekap-semua' : 'blank-template'
  );
  const [filterDusun, setFilterDusun] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [columnMode, setColumnMode] = useState<'standar' | 'lengkap'>('lengkap');
  const [includeDemografi, setIncludeDemografi] = useState(true);
  const [blankRows, setBlankRows] = useState(15);
  const [selectedKk, setSelectedKk] = useState('all');
  const [selectedResidentId, setSelectedResidentId] = useState(residents[0]?.id ?? '');

  const availableDusun = useMemo(() => {
    const set = new Set<string>(profile.daftarDusun);
    for (const r of residents) {
      if (r.dusun) set.add(r.dusun);
    }
    return Array.from(set).filter(Boolean);
  }, [residents, profile.daftarDusun]);

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      if (filterDusun !== 'all' && r.dusun !== filterDusun) return false;
      if (filterGender !== 'all' && r.jenisKelamin !== filterGender) return false;
      if (filterStatus !== 'all' && r.statusKependudukan !== filterStatus) return false;
      return true;
    });
  }, [residents, filterDusun, filterGender, filterStatus]);

  const families = useMemo(() => groupFamilies(filteredResidents), [filteredResidents]);

  const subtitleNote = useMemo(() => {
    const parts: string[] = [];
    if (filterDusun !== 'all') parts.push(`Wilayah: ${filterDusun}`);
    if (filterGender !== 'all') parts.push(`L/P: ${filterGender}`);
    if (filterStatus !== 'all') parts.push(`Status: ${filterStatus}`);
    return parts.join(' · ') || undefined;
  }, [filterDusun, filterGender, filterStatus]);

  const printOptions: PrintOptions = {
    blankRows,
    selectedKk,
    selectedResidentId: selectedResidentId || filteredResidents[0]?.id || residents[0]?.id,
    subtitleNote,
    showLogo: settings.printShowLogo,
    showSignature: settings.printShowSignature,
    dateFormat: settings.dateFormat,
    columnMode,
    includeDemografi,
  };

  const paperLabel = `${PAPER_SIZE_CSS[settings.paperSize].label} · ${
    settings.paperOrientation === 'landscape' ? 'Landscape (Mendatar)' : 'Portrait (Tegak)'
  } · Margin ${PAPER_MARGIN_MM[settings.paperMargin]} mm`;

  return (
    <div className="space-y-6">
      {/* Pilihan Jenis Dokumen Cetak */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Pusat Cetak Data Penduduk (Print / Simpan PDF)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Pilih jenis dokumen, atur filter wilayah atau warga, periksa pratinjau tanpa batas
              baris di bawah, lalu klik Cetak Sekarang.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onTriggerPrint(selectedMode, filteredResidents, printOptions)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg btn-accent whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" />
            Cetak Sekarang / Simpan PDF
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {PRINT_FORMATS.map((fmt) => {
            const active = selectedMode === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setSelectedMode(fmt.id)}
                className={`p-3.5 rounded-xl border text-left transition-colors ${
                  active
                    ? 'btn-accent-soft border-accent'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                }`}
              >
                <p
                  className={`text-xs font-semibold ${
                    active ? 'text-accent' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {fmt.title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {fmt.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Pengaturan Filter Cetak */}
        <div className="pt-2 flex flex-wrap items-end gap-4">
          {(selectedMode === 'rekap-semua' ||
            selectedMode === 'buku-induk' ||
            selectedMode === 'kartu-keluarga' ||
            selectedMode === 'statistik') && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Filter Dusun
                </label>
                <select
                  value={filterDusun}
                  onChange={(e) => setFilterDusun(e.target.value)}
                  className="px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
                >
                  <option value="all">Semua Dusun</option>
                  {availableDusun.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Filter Jenis Kelamin
                </label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
                >
                  <option value="all">Semua (L & P)</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Filter Status Kependudukan
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
                >
                  <option value="all">Semua Status</option>
                  {RESIDENCY_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(selectedMode === 'rekap-semua' || selectedMode === 'buku-induk') && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Format Kolom Tabel
              </label>
              <select
                value={columnMode}
                onChange={(e) => setColumnMode(e.target.value as 'standar' | 'lengkap')}
                className="px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              >
                <option value="lengkap">Lengkap Semua Kolom (18 Kolom)</option>
                <option value="standar">Standar Buku Induk (13 Kolom)</option>
              </select>
            </div>
          )}

          {selectedMode === 'rekap-semua' && (
            <label className="inline-flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={includeDemografi}
                onChange={(e) => setIncludeDemografi(e.target.checked)}
                className="rounded border-slate-300"
              />
              Sertakan 7 Tabel Statistik Demografi
            </label>
          )}

          {selectedMode === 'blank-template' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Baris Kosong
              </label>
              <select
                value={blankRows}
                onChange={(e) => setBlankRows(Number(e.target.value))}
                className="px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              >
                <option value={15}>15 Baris (1 Halaman)</option>
                <option value={25}>25 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris (Multi Halaman)</option>
              </select>
            </div>
          )}

          {selectedMode === 'kartu-keluarga' && (
            <div className="min-w-[240px]">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pilih Nomor KK
              </label>
              <select
                value={selectedKk}
                onChange={(e) => setSelectedKk(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              >
                <option value="all">Semua KK ({families.length} KK)</option>
                {families.map((f) => (
                  <option key={f.noKk} value={f.noKk}>
                    {f.noKk} — {f.kepalaKeluarga} ({f.members.length} jiwa)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedMode === 'biodata-individu' && (
            <div className="min-w-[260px]">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pilih Penduduk
              </label>
              <select
                value={printOptions.selectedResidentId ?? ''}
                onChange={(e) => setSelectedResidentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              >
                {residents.length === 0 ? (
                  <option value="">Belum ada data penduduk</option>
                ) : (
                  residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.namaLengkap} ({r.nik})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Pratinjau Lembar Cetak (Kertas Putih) */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>
            Pratinjau Dokumen Cetak · Kertas aktif: {paperLabel}
          </p>
          {(selectedMode === 'rekap-semua' || selectedMode === 'buku-induk') && (
            <p className="font-medium text-accent">
              Cetak Tidak Terbatas: {filteredResidents.length} baris penduduk siap dicetak multi-halaman
            </p>
          )}
        </div>
        <div className="bg-white border border-slate-300 dark:border-slate-700 rounded-xl p-6 sm:p-8 overflow-x-auto text-black">
          <div className="min-w-[960px]">
            <PrintSheetContent
              mode={selectedMode}
              residents={selectedMode === 'biodata-individu' ? residents : filteredResidents}
              profile={profile}
              options={printOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
