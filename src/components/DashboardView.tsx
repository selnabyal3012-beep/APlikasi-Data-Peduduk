import { useMemo } from 'react';
import {
  FileSpreadsheet,
  Home,
  Mars,
  Plus,
  Sparkles,
  UserPlus,
  Users,
  Venus,
} from 'lucide-react';
import { Resident, VillageProfile } from '../types/population';
import { TableDensityMode } from '../types/settings';

interface DashboardViewProps {
  residents: Resident[];
  profile: VillageProfile;
  tableDensity: TableDensityMode;
  onAddNew: () => void;
  onViewAll: () => void;
  onViewResident: (resident: Resident) => void;
  onGoToTemplates: () => void;
  onLoadSampleData: () => void;
}

const MONTH_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function getStatusClass(status: Resident['statusKependudukan']): string {
  switch (status) {
    case 'Tetap':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
    case 'Pendatang':
    case 'Sementara':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
    case 'Pindah':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
    case 'Meninggal':
      return 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

export function DashboardView({
  residents,
  profile,
  tableDensity,
  onAddNew,
  onViewAll,
  onViewResident,
  onGoToTemplates,
  onLoadSampleData,
}: DashboardViewProps) {
  const stats = useMemo(() => {
    let maleCount = 0;
    let femaleCount = 0;
    const kkSet = new Set<string>();

    for (const r of residents) {
      if (r.jenisKelamin === 'Laki-laki') maleCount += 1;
      else femaleCount += 1;
      const kk = r.noKk.trim();
      if (kk) kkSet.add(kk);
    }

    const total = residents.length;
    const malePct = total > 0 ? Math.round((maleCount / total) * 100) : 0;
    const femalePct = total > 0 ? 100 - malePct : 0;

    return {
      total,
      maleCount,
      femaleCount,
      kkCount: kkSet.size,
      malePct,
      femalePct,
    };
  }, [residents]);

  // Cumulative resident count across the last 8 months based on recorded createdAt dates
  const monthlySeries = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; endTs: number; count: number }[] = [];

    for (let offset = 7; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTH_SHORT_ID[d.getMonth()],
        endTs: endOfMonth.getTime(),
        count: 0,
      });
    }

    for (const r of residents) {
      const createdTs = r.createdAt ? new Date(r.createdAt).getTime() : now.getTime();
      const effectiveTs = Number.isNaN(createdTs) ? now.getTime() : createdTs;
      for (const bucket of months) {
        if (effectiveTs <= bucket.endTs) {
          bucket.count += 1;
        }
      }
    }

    const maxCount = Math.max(...months.map((m) => m.count), 1);
    return { months, maxCount };
  }, [residents]);

  const recentResidents = useMemo(() => {
    return [...residents]
      .sort((a, b) => {
        const aTime = a.updatedAt || a.createdAt || '';
        const bTime = b.updatedAt || b.createdAt || '';
        return bTime.localeCompare(aTime);
      })
      .slice(0, 5);
  }, [residents]);

  // SVG donut geometry
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const maleArc = (stats.malePct / 100) * circumference;
  const femaleArc = (stats.femalePct / 100) * circumference;

  const cellPad = tableDensity === 'compact' ? 'px-4 py-2.5' : 'px-5 py-3.5';

  return (
    <div className="space-y-6">
      {/* Page Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Dashboard Kependudukan
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ringkasan informasi dan statistik data penduduk
            {profile.namaDesa ? ` Desa ${profile.namaDesa}` : ''}.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg btn-accent shadow-xs whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Penduduk
        </button>
      </div>

      {/* 4 KPI Cards Row */}
      <section
        aria-label="Ringkasan statistik utama"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Penduduk
            </p>
            <p className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {stats.total.toLocaleString('id-ID')}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Jumlah seluruh warga terdaftar
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--app-accent-soft)',
              color: 'var(--app-accent-text)',
            }}
          >
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Laki-laki</p>
            <p className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {stats.maleCount.toLocaleString('id-ID')}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Penduduk berjenis kelamin laki-laki
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--app-accent-soft)',
              color: 'var(--app-accent-text)',
            }}
          >
            <Mars className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Perempuan</p>
            <p className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {stats.femaleCount.toLocaleString('id-ID')}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Penduduk berjenis kelamin perempuan
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--app-accent-soft)',
              color: 'var(--app-accent-text)',
            }}
          >
            <Venus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kepala Keluarga
            </p>
            <p className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {stats.kkCount.toLocaleString('id-ID')}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Nomor KK unik terdaftar
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--app-accent-soft)',
              color: 'var(--app-accent-text)',
            }}
          >
            <Home className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* 2-Column Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Jumlah Penduduk per Bulan
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
              8 bulan terakhir
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-end pt-4">
            {stats.total === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-800 text-center px-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada data penduduk untuk ditampilkan pada grafik bulanan.
                </p>
                <div className="mt-4 grid grid-cols-8 gap-3 sm:gap-5 w-full max-w-md items-end h-12">
                  {monthlySeries.months.map((m) => (
                    <div key={m.key} className="flex flex-col items-center gap-1.5">
                      <div className="w-7 sm:w-8 h-1.5 rounded-t bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-1 sm:px-3 border-b border-slate-200 dark:border-slate-800">
                {monthlySeries.months.map((m) => {
                  const pct = m.count > 0 ? Math.max((m.count / monthlySeries.maxCount) * 100, 12) : 4;
                  return (
                    <div
                      key={m.key}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                      title={`${m.label}: ${m.count} penduduk`}
                    >
                      <span className="mb-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.count}
                      </span>
                      <div
                        className="w-7 sm:w-9 rounded-t-md transition-all duration-300"
                        style={{
                          height: `${pct}%`,
                          background:
                            m.count > 0
                              ? 'linear-gradient(180deg, color-mix(in srgb, var(--app-accent) 72%, #ffffff 28%) 0%, var(--app-accent) 100%)'
                              : undefined,
                          backgroundColor: m.count === 0 ? 'rgba(148, 163, 184, 0.25)' : undefined,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-2 sm:gap-4 px-1 sm:px-3">
              {monthlySeries.months.map((m) => (
                <span
                  key={m.key}
                  className="flex-1 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400"
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
            Data riil dihitung otomatis berdasarkan tanggal pencatatan penduduk di perangkat.
          </p>
        </div>

        {/* Gender Composition Donut Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Komposisi Jenis Kelamin
          </h2>

          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6 py-6">
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="22"
                />
                {stats.total > 0 && stats.femaleCount > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="#E59E34"
                    strokeWidth="22"
                    strokeDasharray={`${femaleArc} ${circumference}`}
                    strokeDashoffset={-maleArc}
                  />
                )}
                {stats.total > 0 && stats.maleCount > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    style={{ stroke: 'var(--app-accent)' }}
                    strokeWidth="22"
                    strokeDasharray={`${maleArc} ${circumference}`}
                    strokeDashoffset={0}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.total}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Jiwa</span>
              </div>
            </div>

            <div className="w-full max-w-[220px] space-y-3.5">
              <div className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: 'var(--app-accent)' }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    Laki-laki
                  </span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                  {stats.malePct}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    Perempuan
                  </span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                  {stats.femalePct}%
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                <span>{stats.maleCount} L</span>
                <span>{stats.femaleCount} P</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Residents Table Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Data Penduduk Terbaru
          </h2>

          <button
            type="button"
            onClick={onViewAll}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            Lihat semua
          </button>
        </div>

        {recentResidents.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Belum ada data penduduk terdaftar
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Mulai isi data warga secara manual, unggah template Excel/CSV, atau muat contoh data
              simulasi untuk melihat tampilan lengkap.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg btn-accent whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Input Penduduk Pertama
              </button>
              <button
                type="button"
                onClick={onGoToTemplates}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
                Template Kosong & Impor
              </button>
              <button
                type="button"
                onClick={onLoadSampleData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Muat Data Contoh
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className={cellPad}>NIK</th>
                  <th className={cellPad}>Nama Lengkap</th>
                  <th className={cellPad}>Jenis Kelamin</th>
                  <th className={cellPad}>Tempat Lahir</th>
                  <th className={cellPad}>Alamat</th>
                  <th className={`${cellPad} text-right`}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-[13px]">
                {recentResidents.map((r) => {
                  const addressParts = [
                    r.alamat,
                    r.dusun,
                    r.rt || r.rw ? `RT ${r.rt || '000'}/RW ${r.rw || '000'}` : '',
                  ].filter(Boolean);
                  const displayAddress = addressParts[0] || r.dusun || '-';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onViewResident(r)}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td
                        className={`${cellPad} font-mono text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap`}
                      >
                        {r.nik || '-'}
                      </td>
                      <td
                        className={`${cellPad} font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap`}
                      >
                        {r.namaLengkap}
                      </td>
                      <td
                        className={`${cellPad} text-slate-600 dark:text-slate-300 whitespace-nowrap`}
                      >
                        {r.jenisKelamin}
                      </td>
                      <td
                        className={`${cellPad} text-slate-600 dark:text-slate-300 whitespace-nowrap`}
                      >
                        {r.tempatLahir || '-'}
                      </td>
                      <td
                        className={`${cellPad} text-slate-600 dark:text-slate-300 max-w-[240px] truncate`}
                        title={addressParts.join(', ')}
                      >
                        {displayAddress}
                      </td>
                      <td className={`${cellPad} text-right whitespace-nowrap`}>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${getStatusClass(
                            r.statusKependudukan
                          )}`}
                          title={`Status kependudukan: ${r.statusKependudukan}`}
                        >
                          {r.statusKependudukan === 'Tetap' ? 'Aktif' : r.statusKependudukan}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
