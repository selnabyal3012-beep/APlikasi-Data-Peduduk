import { useMemo, useState } from 'react';
import {
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Paperclip,
  Printer,
  Search,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import {
  GENDER_OPTIONS,
  RESIDENCY_STATUS_OPTIONS,
  Resident,
  VillageProfile,
} from '../types/population';
import { AppSettings } from '../types/settings';
import { calculateAge, formatIndonesianDate } from '../lib/demographics';
import {
  downloadEmptyCsvTemplate,
  downloadEmptyExcelTemplate,
  exportResidentsToExcel,
} from '../lib/csvAndExcel';

interface ResidentTableProps {
  residents: Resident[];
  profile: VillageProfile;
  settings: AppSettings;
  onAddNew: () => void;
  onEdit: (resident: Resident) => void;
  onView: (resident: Resident) => void;
  onManageAttachments: (resident: Resident) => void;
  onDeleteMany: (ids: string[]) => void;
  onGoToTemplates: () => void;
  onPrintBlankTemplate: () => void;
  onPrintBukuInduk: () => void;
  onLoadSampleData: () => void;
}

type SortField = 'nama' | 'nik' | 'usia' | 'dusun';

export function ResidentTable({
  residents,
  profile,
  settings,
  onAddNew,
  onEdit,
  onView,
  onManageAttachments,
  onDeleteMany,
  onGoToTemplates,
  onPrintBlankTemplate,
  onPrintBukuInduk,
  onLoadSampleData,
}: ResidentTableProps) {
  const [search, setSearch] = useState('');
  const [filterDusun, setFilterDusun] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<SortField>('nama');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null);
  const [page, setPage] = useState(1);

  const pageSize = settings.rowsPerPage;
  const cellPy = settings.tableDensity === 'compact' ? 'py-1.5' : 'py-2.5';
  const headPy = settings.tableDensity === 'compact' ? 'py-2' : 'py-3';

  const availableDusun = useMemo(() => {
    const set = new Set<string>(profile.daftarDusun);
    for (const r of residents) {
      if (r.dusun) set.add(r.dusun);
    }
    return Array.from(set).filter(Boolean);
  }, [residents, profile.daftarDusun]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = residents.filter((r) => {
      if (filterDusun !== 'all' && r.dusun !== filterDusun) return false;
      if (filterGender !== 'all' && r.jenisKelamin !== filterGender) return false;
      if (filterStatus !== 'all' && r.statusKependudukan !== filterStatus) return false;
      if (!q) return true;
      return (
        r.namaLengkap.toLowerCase().includes(q) ||
        r.nik.toLowerCase().includes(q) ||
        r.noKk.toLowerCase().includes(q) ||
        r.tempatLahir.toLowerCase().includes(q) ||
        r.alamat.toLowerCase().includes(q) ||
        r.pekerjaan.toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'nama') cmp = a.namaLengkap.localeCompare(b.namaLengkap);
      else if (sortField === 'nik') cmp = a.nik.localeCompare(b.nik);
      else if (sortField === 'dusun') cmp = (a.dusun || '').localeCompare(b.dusun || '');
      else if (sortField === 'usia') {
        const ageA = calculateAge(a.tanggalLahir) ?? -1;
        const ageB = calculateAge(b.tanggalLahir) ?? -1;
        cmp = ageA - ageB;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [residents, search, filterDusun, filterGender, filterStatus, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function toggleSelectAllOnPage() {
    const pageIds = pageItems.map((r) => r.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      for (const id of pageIds) next.delete(id);
    } else {
      for (const id of pageIds) next.add(id);
    }
    setSelectedIds(next);
  }

  function toggleSelectOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  // Empty Database State (Default on first launch!)
  if (residents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 md:p-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-accent">
              Template Kosong Siap Pakai · Penyimpanan Offline Lokal
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Buku Induk Penduduk Masih Kosong
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Semua data disimpan langsung di perangkat Anda tanpa internet. Anda dapat langsung
              mengisi data warga secara manual satu per satu, mengunduh template kosong Excel/CSV
              untuk diisi terlebih dahulu, atau mencetak formulir kosong untuk pendataan lapangan.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg btn-accent whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                Input Penduduk Pertama
              </button>
              <button
                type="button"
                onClick={() => downloadEmptyExcelTemplate(profile, 50)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-accent" />
                Unduh Template Kosong (.xls)
              </button>
              <button
                type="button"
                onClick={() => downloadEmptyCsvTemplate(25)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Unduh Template Kosong (.csv)
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                01. Input Manual Cepat
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Ketik data per KK/NIK langsung di aplikasi. No. KK dan alamat otomatis bertahan saat
                menambah anggota keluarga berikutnya.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                02. Template Excel & CSV Kosong
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Kolom NIK dan No. KK sudah diformat sebagai teks agar 16 digit tidak rusak saat dibuka
                di Excel, lalu impor kembali lewat menu Template & Data.
              </p>
              <button
                type="button"
                onClick={onGoToTemplates}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
              >
                <Upload className="w-3.5 h-3.5" />
                Buka Halaman Impor & Template
              </button>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                03. Formulir Kertas Kosong
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Cetak tabel Buku Induk kosong untuk diisi manual dengan pulpen oleh ketua RT/RW
                saat pendataan lapangan.
              </p>
              <button
                type="button"
                onClick={onPrintBlankTemplate}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Formulir Kosong
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ingin melihat contoh tampilan terlebih dahulu sebelum mengisi data asli?
            </p>
            <button
              type="button"
              onClick={onLoadSampleData}
              className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Muat 6 Contoh Data Uji Coba
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar Filter & Pencarian */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari NIK, No. KK, Nama, Alamat, atau Pekerjaan..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus-accent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter Dusun"
              value={filterDusun}
              onChange={(e) => {
                setFilterDusun(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="all">Semua Dusun</option>
              {availableDusun.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Jenis Kelamin"
              value={filterGender}
              onChange={(e) => {
                setFilterGender(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="all">Semua L/P</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Status Kependudukan"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="all">Semua Status</option>
              {RESIDENCY_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Menampilkan{' '}
              <strong className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {filtered.length}
              </strong>{' '}
              dari{' '}
              <strong className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {residents.length}
              </strong>{' '}
              penduduk
            </span>
            {selectedIds.size > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteIds(Array.from(selectedIds))}
                  className="inline-flex items-center gap-1 font-medium text-red-700 dark:text-red-400 hover:underline whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus {selectedIds.size} Terpilih
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportResidentsToExcel(filtered, profile)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
              Ekspor Excel (.xls)
            </button>
            <button
              type="button"
              onClick={onPrintBukuInduk}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Buku Induk
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Banner */}
      {confirmDeleteIds && confirmDeleteIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-sm">
          <span className="text-red-900 dark:text-red-200">
            Hapus permanen <strong className="font-mono tabular-nums">{confirmDeleteIds.length}</strong> data penduduk terpilih dari penyimpanan lokal?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteIds(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteMany(confirmDeleteIds);
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  for (const id of confirmDeleteIds) next.delete(id);
                  return next;
                });
                setConfirmDeleteIds(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-700 rounded-md hover:bg-red-800 whitespace-nowrap shrink-0"
            >
              Ya, Hapus Data
            </button>
          </div>
        </div>
      )}

      {/* High-Density Data Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className={`${headPy} pl-4 pr-2 w-10`}>
                  <input
                    type="checkbox"
                    aria-label="Pilih semua baris di halaman ini"
                    checked={
                      pageItems.length > 0 && pageItems.every((r) => selectedIds.has(r.id))
                    }
                    onChange={toggleSelectAllOnPage}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                </th>
                <th className={`${headPy} px-3 whitespace-nowrap`}>
                  <button
                    type="button"
                    onClick={() => toggleSort('nik')}
                    className="hover:text-slate-900 dark:hover:text-white"
                  >
                    NIK / No. KK {sortField === 'nik' ? (sortAsc ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className={`${headPy} px-3 whitespace-nowrap`}>
                  <button
                    type="button"
                    onClick={() => toggleSort('nama')}
                    className="hover:text-slate-900 dark:hover:text-white"
                  >
                    Nama Lengkap {sortField === 'nama' ? (sortAsc ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className={`${headPy} px-3 whitespace-nowrap`}>L/P</th>
                <th className={`${headPy} px-3 whitespace-nowrap`}>
                  <button
                    type="button"
                    onClick={() => toggleSort('usia')}
                    className="hover:text-slate-900 dark:hover:text-white"
                  >
                    Tempat, Tgl Lahir / Usia {sortField === 'usia' ? (sortAsc ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className={`${headPy} px-3 whitespace-nowrap`}>
                  <button
                    type="button"
                    onClick={() => toggleSort('dusun')}
                    className="hover:text-slate-900 dark:hover:text-white"
                  >
                    Wilayah {sortField === 'dusun' ? (sortAsc ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className={`${headPy} px-3 whitespace-nowrap`}>Pekerjaan / Pendidikan</th>
                <th className={`${headPy} px-3 whitespace-nowrap`}>Foto / Dokumen</th>
                <th className={`${headPy} px-3 whitespace-nowrap`}>Status</th>
                <th className={`${headPy} pl-3 pr-4 text-right whitespace-nowrap`}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    Tidak ada data penduduk yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                pageItems.map((r) => {
                  const age = calculateAge(r.tanggalLahir);
                  const statusTone =
                    r.statusKependudukan === 'Tetap'
                      ? 'text-accent'
                      : r.statusKependudukan === 'Pendatang' || r.statusKependudukan === 'Sementara'
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-red-700 dark:text-red-400';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className={`${cellPy} pl-4 pr-2 align-top`}>
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${r.namaLengkap}`}
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleSelectOne(r.id)}
                          className="mt-1 rounded border-slate-300 dark:border-slate-600"
                        />
                      </td>
                      <td className={`${cellPy} px-3 align-top`}>
                        <div className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                          {r.nik || '-'}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          KK: {r.noKk || '-'}
                        </div>
                      </td>
                      <td className={`${cellPy} px-3 align-top`}>
                        <button
                          type="button"
                          onClick={() => onView(r)}
                          className="font-medium text-slate-900 dark:text-slate-100 hover:underline text-left"
                        >
                          {r.namaLengkap}
                        </button>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {r.hubunganKeluarga} · {r.statusPerkawinan}
                        </div>
                      </td>
                      <td className={`${cellPy} px-3 align-top font-mono text-xs text-slate-700 dark:text-slate-300`}>
                        {r.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                      </td>
                      <td className={`${cellPy} px-3 align-top`}>
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {r.tempatLahir || '-'}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatIndonesianDate(r.tanggalLahir, settings.dateFormat)} ·{' '}
                          {age !== null ? `${age} th` : '-'}
                        </div>
                      </td>
                      <td className={`${cellPy} px-3 align-top`}>
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {r.dusun || '-'}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          RT {r.rt || '-'} / RW {r.rw || '-'}
                        </div>
                      </td>
                      <td className={`${cellPy} px-3 align-top`}>
                        <div className="text-xs text-slate-800 dark:text-slate-200">
                          {r.pekerjaan || '-'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {r.pendidikan}
                        </div>
                      </td>
                      <td className={`${cellPy} px-3 align-top whitespace-nowrap`}>
                        <button
                          type="button"
                          onClick={() => onManageAttachments(r)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {r.fotoUrl ? (
                            <img
                              src={r.fotoUrl}
                              alt=""
                              className="w-4 h-4 rounded-xs object-cover shrink-0"
                            />
                          ) : (
                            <Paperclip className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                          )}
                          <span>
                            {r.fotoUrl || (r.dokumen?.length ?? 0) > 0
                              ? `${r.fotoUrl ? 'Foto' : ''}${
                                  r.fotoUrl && (r.dokumen?.length ?? 0) > 0 ? ' · ' : ''
                                }${(r.dokumen?.length ?? 0) > 0 ? `${r.dokumen?.length} Dok` : ''}`
                              : 'Upload'}
                          </span>
                        </button>
                      </td>
                      <td className={`${cellPy} px-3 align-top`}>
                        <span className={`text-xs font-semibold ${statusTone}`}>
                          {r.statusKependudukan}
                        </span>
                      </td>
                      <td className={`${cellPy} pl-3 pr-4 align-top text-right whitespace-nowrap`}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onView(r)}
                            title="Lihat Detail"
                            aria-label={`Lihat detail ${r.namaLengkap}`}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(r)}
                            title="Ubah Data"
                            aria-label={`Ubah data ${r.namaLengkap}`}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-accent rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteIds([r.id])}
                            title="Hapus Data"
                            aria-label={`Hapus ${r.namaLengkap}`}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-mono tabular-nums">
              Halaman {safePage} dari {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
