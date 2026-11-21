import {
  BarChart3,
  Building2,
  FileSpreadsheet,
  Home,
  LayoutDashboard,
  Printer,
  Settings,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { AppView, VillageProfile } from '../types/population';

interface SidebarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  totalResidents: number;
  totalFamilies: number;
  profile: VillageProfile;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: AppView; label: string; icon: typeof Users }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'buku-induk', label: 'Buku Induk Penduduk', icon: Users },
  { id: 'input-manual', label: 'Input Manual', icon: UserPlus },
  { id: 'kartu-keluarga', label: 'Kartu Keluarga', icon: Home },
  { id: 'statistik', label: 'Rekap Semua Data', icon: BarChart3 },
  { id: 'print-data', label: 'Print Data Penduduk', icon: Printer },
  { id: 'template-data', label: 'Template Kosong & Data', icon: FileSpreadsheet },
  { id: 'profil-desa', label: 'Profil Desa', icon: Building2 },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
];

export function Sidebar({
  activeView,
  onSelectView,
  totalResidents,
  totalFamilies,
  profile,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const villageTitle = profile.namaDesa ? `Desa ${profile.namaDesa}` : 'Buku Induk Desa';
  const villageSub =
    profile.kecamatan || profile.kabupaten
      ? [profile.kecamatan ? `Kec. ${profile.kecamatan}` : '', profile.kabupaten]
          .filter(Boolean)
          .join(' · ')
      : 'Penyimpanan Lokal Perangkat';

  const content = (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3 px-5 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          {profile.logoUrl && (
            <img
              src={profile.logoUrl}
              alt="Logo Desa"
              className="w-9 h-9 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {villageTitle}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              {villageSub}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md"
          aria-label="Tutup menu navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menu utama">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'btn-accent'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2.5">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Total Jiwa</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {totalResidents}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Jumlah KK</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {totalFamilies}
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          <p>
            Tahun Buku <span className="font-mono tabular-nums">{profile.tahunBuku || '-'}</span> · Mode Offline
          </p>
          <p className="mt-1 text-slate-700 dark:text-slate-300 font-medium">
            Pengembang: Selpius Nabyal, S.Pd.Gr
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 no-print">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">{content}</aside>
        </div>
      )}
    </>
  );
}
