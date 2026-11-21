import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search, UserPlus } from 'lucide-react';
import { Resident } from '../types/population';
import { DateFormatMode } from '../types/settings';
import { calculateAge, formatIndonesianDate, groupFamilies } from '../lib/demographics';

interface FamilyCardsViewProps {
  residents: Resident[];
  dateFormat?: DateFormatMode;
  onEditMember: (resident: Resident) => void;
  onAddNew: () => void;
}

export function FamilyCardsView({
  residents,
  dateFormat = 'dd/mm/yyyy',
  onEditMember,
  onAddNew,
}: FamilyCardsViewProps) {
  const [search, setSearch] = useState('');
  const [expandedKk, setExpandedKk] = useState<Set<string>>(new Set());

  const families = useMemo(() => groupFamilies(residents), [residents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return families;
    return families.filter(
      (f) =>
        f.noKk.toLowerCase().includes(q) ||
        f.kepalaKeluarga.toLowerCase().includes(q) ||
        f.dusun.toLowerCase().includes(q) ||
        f.members.some(
          (m) =>
            m.namaLengkap.toLowerCase().includes(q) ||
            m.nik.toLowerCase().includes(q) ||
            m.tempatLahir.toLowerCase().includes(q)
        )
    );
  }, [families, search]);

  function toggleExpand(noKk: string) {
    setExpandedKk((prev) => {
      const next = new Set(prev);
      if (next.has(noKk)) next.delete(noKk);
      else next.add(noKk);
      return next;
    });
  }

  if (residents.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Belum Ada Data Kartu Keluarga
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
          Kartu Keluarga akan terbentuk otomatis berdasarkan Nomor KK yang sama saat Anda
          menginput data penduduk secara manual atau mengimpor template.
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
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No. KK, Kepala Keluarga, Nama Anggota, atau Dusun..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus-accent"
          />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Total <strong className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">{filtered.length}</strong> Kartu Keluarga
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((fam) => {
          const isOpen = expandedKk.has(fam.noKk);
          return (
            <div
              key={fam.noKk}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleExpand(fam.noKk)}
                className="w-full px-5 py-4 flex flex-wrap items-center justify-between gap-4 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-1 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-1 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {fam.noKk}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                      <span className="text-sm font-semibold text-accent">
                        {fam.kepalaKeluarga}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {fam.dusun} · RT {fam.rt} / RW {fam.rw} · {fam.alamat || 'Alamat belum diisi'}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-700 dark:text-slate-300 tabular-nums shrink-0">
                  {fam.members.length} Jiwa
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        <th className="py-2.5 pl-5 pr-3">No</th>
                        <th className="py-2.5 px-3">NIK</th>
                        <th className="py-2.5 px-3">Nama Lengkap</th>
                        <th className="py-2.5 px-3">L/P</th>
                        <th className="py-2.5 px-3">Tempat, Tgl Lahir (Usia)</th>
                        <th className="py-2.5 px-3">Hubungan Keluarga</th>
                        <th className="py-2.5 px-3">Pekerjaan</th>
                        <th className="py-2.5 pl-3 pr-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {fam.members.map((m, idx) => {
                        const age = calculateAge(m.tanggalLahir);
                        return (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 pl-5 pr-3 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                              {m.nik}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                              {m.namaLengkap}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                              {m.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              <span>{m.tempatLahir || '-'}, </span>
                              <span className="font-mono tabular-nums">
                                {formatIndonesianDate(m.tanggalLahir, dateFormat)} (
                                {age !== null ? `${age} th` : '-'})
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {m.hubunganKeluarga}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {m.pekerjaan}
                            </td>
                            <td className="py-2.5 pl-3 pr-5 text-right">
                              <button
                                type="button"
                                onClick={() => onEditMember(m)}
                                className="font-medium text-accent hover:underline"
                              >
                                Ubah
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
