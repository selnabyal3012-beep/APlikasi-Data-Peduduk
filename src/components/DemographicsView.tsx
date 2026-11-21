import { useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  Search,
  Table2,
  UserPlus,
} from 'lucide-react';
import {
  GENDER_OPTIONS,
  RESIDENCY_STATUS_OPTIONS,
  Resident,
  VillageProfile,
} from '../types/population';
import { DateFormatMode } from '../types/settings';
import {
  CountBucket,
  calculateAge,
  computeDemographics,
  formatIndonesianDate,
} from '../lib/demographics';
import { exportResidentsToCsv, exportResidentsToExcel } from '../lib/csvAndExcel';

interface DemographicsViewProps {
  residents: Resident[];
  profile: VillageProfile;
  dateFormat: DateFormatMode;
  onPrintRekapSemua: (
    filtered: Resident[],
    columnMode: 'standar' | 'lengkap',
    subtitleNote?: string
  ) => void;
  onPrintBukuInduk: (
    filtered: Resident[],
    columnMode: 'standar' | 'lengkap',
    subtitleNote?: string
  ) => void;
  onPrintStatistik: () => void;
  onAddNew: () => void;
}

function BreakdownSection({
  title,
  buckets,
  totalBase,
}: {
  title: string;
  buckets: CountBucket[];
  totalBase: number;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
          L / P / Total
        </span>
      </div>

      {buckets.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada data.</p>
      ) : (
        <div className="space-y-3">
          {buckets.map((b) => {
            const pct = totalBase > 0 ? Math.round((b.count / totalBase) * 1000) / 10 : 0;
            return (
              <div key={b.label} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {b.label}
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 tabular-nums shrink-0">
                    {b.male} / {b.female} /{' '}
                    <strong className="text-slate-900 dark:text-slate-100">{b.count}</strong> ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: 'var(--app-accent)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DemographicsView({
  residents,
  profile,
  dateFormat,
  onPrintRekapSemua,
  onPrintBukuInduk,
  onPrintStatistik,
  onAddNew,
}: DemographicsViewProps) {
  const [activeTab, setActiveTab] = useState<'tabel-penuh' | 'demografi'>('tabel-penuh');
  const [search, setSearch] = useState('');
  const [filterDusun, setFilterDusun] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [columnMode, setColumnMode] = useState<'standar' | 'lengkap'>('lengkap');

  const availableDusun = useMemo(() => {
    const set = new Set<string>(profile.daftarDusun);
    for (const r of residents) {
      if (r.dusun) set.add(r.dusun);
    }
    return Array.from(set).filter(Boolean);
  }, [residents, profile.daftarDusun]);

  const filteredResidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return residents.filter((r) => {
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
        r.pekerjaan.toLowerCase().includes(q) ||
        r.dusun.toLowerCase().includes(q)
      );
    });
  }, [residents, search, filterDusun, filterGender, filterStatus]);

  const subtitleNote = useMemo(() => {
    const parts: string[] = [];
    if (filterDusun !== 'all') parts.push(`Wilayah: ${filterDusun}`);
    if (filterGender !== 'all') parts.push(`Jenis Kelamin: ${filterGender}`);
    if (filterStatus !== 'all') parts.push(`Status: ${filterStatus}`);
    if (search.trim()) parts.push(`Pencarian: "${search.trim()}"`);
    return parts.join(' · ') || undefined;
  }, [filterDusun, filterGender, filterStatus, search]);

  const stats = useMemo(() => computeDemographics(filteredResidents), [filteredResidents]);

  if (residents.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Rekapan Data Penduduk Masih Kosong
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
          Tabel rekapan lengkap tanpa batas halaman dan statistik demografi otomatis muncul
          setelah Anda mengisi data penduduk.
        </p>
        <button
          type="button"
          onClick={onAddNew}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg btn-accent"
        >
          <UserPlus className="w-4 h-4" />
          Input Penduduk Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Tombol Cetak Tidak Terbatas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Rekapan Semua Data Penduduk & Cetak Tidak Terbatas
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Menampilkan seluruh {filteredResidents.length} dari {residents.length} baris data
              penduduk tanpa batas halaman. Saat dicetak, judul kolom otomatis berulang di setiap
              halaman.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintRekapSemua(filteredResidents, columnMode, subtitleNote)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg btn-accent whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              Cetak Rekapan Lengkap ({filteredResidents.length} Baris)
            </button>

            <button
              type="button"
              onClick={() => onPrintBukuInduk(filteredResidents, columnMode, subtitleNote)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Tabel Saja
            </button>

            <button
              type="button"
              onClick={onPrintStatistik}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Cetak Statistik
            </button>

            <button
              type="button"
              onClick={() => exportResidentsToExcel(filteredResidents, profile)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
              Ekspor Excel
            </button>

            <button
              type="button"
              onClick={() => exportResidentsToCsv(filteredResidents)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </button>
          </div>
        </div>

        {/* Filter & Pencarian + Switch Tab */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('tabel-penuh')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 ${
                activeTab === 'tabel-penuh'
                  ? 'btn-accent-soft border-accent'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Tabel Semua Data ({filteredResidents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demografi')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 ${
                activeTab === 'demografi'
                  ? 'btn-accent-soft border-accent'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Ringkasan Demografi (7 Kategori)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIK, No. KK..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent w-48"
              />
            </div>

            <select
              value={filterDusun}
              onChange={(e) => setFilterDusun(e.target.value)}
              aria-label="Filter Dusun"
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="all">Semua Dusun</option>
              {availableDusun.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              aria-label="Filter Jenis Kelamin"
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="all">Semua L/P</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter Status Kependudukan"
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="all">Semua Status</option>
              {RESIDENCY_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={columnMode}
              onChange={(e) => setColumnMode(e.target.value as 'standar' | 'lengkap')}
              aria-label="Mode Kolom Tabel"
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="lengkap">18 Kolom Lengkap</option>
              <option value="standar">13 Kolom Standar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ringkasan KPI Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Penduduk Aktif</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.totalAktif}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Total terfilter: {stats.totalPenduduk}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Kepala / Kartu Keluarga</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.totalKk}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">KK Aktif Terdaftar</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Laki-laki (Aktif)</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.lakiLaki}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {stats.totalAktif > 0 ? Math.round((stats.lakiLaki / stats.totalAktif) * 100) : 0}% dari aktif
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Perempuan (Aktif)</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.perempuan}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {stats.totalAktif > 0 ? Math.round((stats.perempuan / stats.totalAktif) * 100) : 0}% dari aktif
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Wajib KTP (17+ / Kawin)</p>
          <p className="mt-1 font-mono text-2xl font-bold text-accent tabular-nums">
            {stats.wajibKtp}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Estimasi hak pilih/KTP</p>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'tabel-penuh' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Tabel Rekapan Lengkap — Tanpa Batas Halaman ({filteredResidents.length} Baris)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Mode {columnMode === 'lengkap' ? '18 Kolom Lengkap' : '13 Kolom Standar'} · Gulir
              horizontal jika kolom lebar
            </span>
          </div>

          <div className="overflow-x-auto max-h-[68vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2.5 font-semibold text-center whitespace-nowrap">No</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">No. KK</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">NIK</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Nama Lengkap</th>
                  <th className="px-3 py-2.5 font-semibold text-center whitespace-nowrap">L/P</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Tempat Lahir</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Tanggal Lahir</th>
                  {columnMode === 'lengkap' && (
                    <th className="px-3 py-2.5 font-semibold text-center whitespace-nowrap">
                      Umur
                    </th>
                  )}
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Agama</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Pendidikan</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Pekerjaan</th>
                  {columnMode === 'lengkap' && (
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Status Kawin</th>
                  )}
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">SHDK</th>
                  {columnMode === 'lengkap' && (
                    <>
                      <th className="px-3 py-2.5 font-semibold text-center whitespace-nowrap">
                        Darah
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-center whitespace-nowrap">
                        WN
                      </th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Orang Tua (Ayah / Ibu)
                      </th>
                    </>
                  )}
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                    Alamat / Dusun / RT-RW
                  </th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Status</th>
                  {columnMode === 'lengkap' && (
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Keterangan</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredResidents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnMode === 'lengkap' ? 19 : 13}
                      className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      Tidak ada data penduduk yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredResidents.map((r, idx) => {
                    const age = calculateAge(r.tanggalLahir);
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                      >
                        <td className="px-3 py-2 text-center font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums whitespace-nowrap">
                          {r.noKk || '-'}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums whitespace-nowrap">
                          {r.nik || '-'}
                        </td>
                        <td className="px-3 py-2 font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                          {r.namaLengkap}
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          {r.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.tempatLahir || '-'}</td>
                        <td className="px-3 py-2 font-mono tabular-nums whitespace-nowrap">
                          {formatIndonesianDate(r.tanggalLahir, dateFormat)}
                        </td>
                        {columnMode === 'lengkap' && (
                          <td className="px-3 py-2 text-center font-mono tabular-nums whitespace-nowrap">
                            {age !== null ? `${age} th` : '-'}
                          </td>
                        )}
                        <td className="px-3 py-2 whitespace-nowrap">{r.agama}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.pendidikan}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.pekerjaan || '-'}</td>
                        {columnMode === 'lengkap' && (
                          <td className="px-3 py-2 whitespace-nowrap">{r.statusPerkawinan}</td>
                        )}
                        <td className="px-3 py-2 whitespace-nowrap">{r.hubunganKeluarga}</td>
                        {columnMode === 'lengkap' && (
                          <>
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              {r.golonganDarah === 'Tidak Tahu' ? '-' : r.golonganDarah}
                            </td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              {r.kewarganegaraan}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {r.namaAyah || '-'} / {r.namaIbu || '-'}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2 whitespace-nowrap">
                          {[
                            r.alamat,
                            r.dusun,
                            r.rt || r.rw ? `RT ${r.rt || '00'}/RW ${r.rw || '00'}` : '',
                          ]
                            .filter(Boolean)
                            .join(', ') || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap font-medium">
                          {r.statusKependudukan}
                        </td>
                        {columnMode === 'lengkap' && (
                          <td className="px-3 py-2 whitespace-nowrap text-slate-500 dark:text-slate-400">
                            {r.keterangan || '-'}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BreakdownSection
            title="Sebaran per Dusun / Wilayah (Aktif)"
            buckets={stats.byDusun}
            totalBase={stats.totalAktif}
          />
          <BreakdownSection
            title="Kelompok Umur (Aktif)"
            buckets={stats.ageGroups}
            totalBase={stats.totalAktif}
          />
          <BreakdownSection
            title="Tingkat Pendidikan (Aktif)"
            buckets={stats.byEducation}
            totalBase={stats.totalAktif}
          />
          <BreakdownSection
            title="Mata Pencaharian / Pekerjaan (Aktif)"
            buckets={stats.byOccupation}
            totalBase={stats.totalAktif}
          />
          <BreakdownSection
            title="Agama (Aktif)"
            buckets={stats.byReligion}
            totalBase={stats.totalAktif}
          />
          <BreakdownSection
            title="Status Perkawinan (Aktif)"
            buckets={stats.byMaritalStatus}
            totalBase={stats.totalAktif}
          />
          <BreakdownSection
            title="Status Kependudukan (Semua Data)"
            buckets={stats.byResidencyStatus}
            totalBase={stats.totalPenduduk}
          />
        </div>
      )}
    </div>
  );
}
