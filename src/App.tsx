import { useEffect, useMemo, useState } from 'react';
import { Check, LogIn, Menu, UserCheck, UserPlus, X } from 'lucide-react';
import {
  AppView,
  DEFAULT_VILLAGE_PROFILE,
  PrintMode,
  Resident,
  ResidentDocument,
  VillageProfile,
} from './types/population';
import { AppSettings, DEFAULT_APP_SETTINGS } from './types/settings';
import {
  loadAppSettingsOffline,
  loadResidentsOffline,
  loadVillageProfileOffline,
  saveAllResidentsOffline,
  saveAppSettingsOffline,
  saveVillageProfileOffline,
} from './lib/storage';
import { applyAppSettingsToDom } from './lib/applySettings';
import { parseCsvResidents } from './lib/csvAndExcel';
import {
  OfflineAuthState,
  getInitialAuthState,
  hashPasswordOffline,
  saveAuthConfig,
  setOfflineSessionActive,
} from './lib/offlineAuth';
import { SAMPLE_VILLAGE_PROFILE, createSampleResidents } from './data/sampleResidents';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ResidentTable } from './components/ResidentTable';
import { ResidentForm } from './components/ResidentForm';
import { ResidentDetailModal } from './components/ResidentDetailModal';
import { ResidentAttachmentsModal } from './components/ResidentAttachmentsModal';
import { FamilyCardsView } from './components/FamilyCardsView';
import { DemographicsView } from './components/DemographicsView';
import { TemplatesAndBackupView } from './components/TemplatesAndBackupView';
import { VillageProfileView } from './components/VillageProfileView';
import { SettingsView } from './components/SettingsView';
import { PrintOptions, PrintViews } from './components/PrintViews';
import { PrintCenterView } from './components/PrintCenterView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { LoginModal } from './components/LoginModal';
import { QuickActionBar } from './components/QuickActionBar';

const VIEW_TITLES: Record<AppView, string> = {
  dashboard: 'Dashboard Kependudukan',
  'buku-induk': 'Buku Induk Penduduk',
  'input-manual': 'Input Data Penduduk Manual',
  'kartu-keluarga': 'Rekapitulasi Kartu Keluarga',
  statistik: 'Rekapan Semua Data & Statistik',
  'print-data': 'Print Data Penduduk',
  'template-data': 'Template Kosong, Impor & Cadangan',
  'profil-desa': 'Profil & Identitas Desa',
  pengaturan: 'Pengaturan Aplikasi & Tampilan',
};

export default function App() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [profile, setProfile] = useState<VillageProfile>(DEFAULT_VILLAGE_PROFILE);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const [authState, setAuthState] = useState<OfflineAuthState | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [viewingResident, setViewingResident] = useState<Resident | null>(null);
  const [attachingResidentId, setAttachingResidentId] = useState<string | null>(null);
  const [quickNotice, setQuickNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>('none');
  const [printResidents, setPrintResidents] = useState<Resident[] | null>(null);
  const [printOptions, setPrintOptions] = useState<PrintOptions | undefined>(undefined);

  // Initial load from IndexedDB / localStorage
  useEffect(() => {
    let active = true;
    Promise.all([
      loadResidentsOffline(),
      loadVillageProfileOffline(),
      getInitialAuthState(),
      loadAppSettingsOffline(),
    ]).then(([storedResidents, storedProfile, initialAuth, storedSettings]) => {
      if (!active) return;
      setResidents(storedResidents);
      setProfile(storedProfile);
      setAuthState(initialAuth);
      setAppSettings(storedSettings);
      applyAppSettingsToDom(storedSettings);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Sync theme, font, screen mode & dynamic print @page rules
  useEffect(() => {
    applyAppSettingsToDom(appSettings);
    if (appSettings.colorMode !== 'system' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => applyAppSettingsToDom(appSettings);
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, [appSettings]);

  // Trigger browser print dialog after PrintViews renders
  useEffect(() => {
    if (printMode === 'none') return;

    const handleAfterPrint = () => {
      setPrintMode('none');
    };
    window.addEventListener('afterprint', handleAfterPrint);

    const timer = window.setTimeout(() => {
      window.print();
    }, 80);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printMode]);

  const totalFamilies = useMemo(() => {
    const kkSet = new Set(residents.map((r) => r.noKk.trim()).filter(Boolean));
    return kkSet.size;
  }, [residents]);

  function persistResidents(next: Resident[]) {
    setResidents(next);
    void saveAllResidentsOffline(next);
  }

  function persistProfile(next: VillageProfile) {
    setProfile(next);
    void saveVillageProfileOffline(next);
  }

  function handleUpdateSettings(next: AppSettings) {
    setAppSettings(next);
    void saveAppSettingsOffline(next);
  }

  function handleSaveResident(record: Resident, addAnother: boolean) {
    const exists = residents.some((r) => r.id === record.id);
    const next = exists
      ? residents.map((r) => (r.id === record.id ? record : r))
      : [...residents, record];

    persistResidents(next);

    if (!addAnother) {
      setEditingResident(null);
      setActiveView('buku-induk');
    }
  }

  function handleDeleteMany(ids: string[]) {
    const idSet = new Set(ids);
    const next = residents.filter((r) => !idSet.has(r.id));
    persistResidents(next);
  }

  function handleImportResidents(imported: Resident[], mode: 'merge' | 'replace') {
    if (mode === 'replace') {
      persistResidents(imported);
      return;
    }

    const byNik = new Map<string, Resident>();
    for (const r of residents) {
      byNik.set(r.nik || r.id, r);
    }
    for (const incoming of imported) {
      const key = incoming.nik || incoming.id;
      const existing = byNik.get(key);
      if (existing) {
        byNik.set(key, {
          ...incoming,
          id: existing.id,
          createdAt: existing.createdAt,
        });
      } else {
        byNik.set(key, incoming);
      }
    }
    persistResidents(Array.from(byNik.values()));
  }

  function handleRestoreBackup(restoredResidents: Resident[], restoredProfile?: VillageProfile) {
    persistResidents(restoredResidents);
    if (restoredProfile) {
      persistProfile({ ...DEFAULT_VILLAGE_PROFILE, ...restoredProfile });
    }
  }

  function handleClearAll() {
    persistResidents([]);
  }

  function handleLoadSampleData() {
    persistResidents(createSampleResidents());
    if (!profile.namaDesa) {
      persistProfile(SAMPLE_VILLAGE_PROFILE);
    }
  }

  function handleLoginSuccess() {
    setOfflineSessionActive(true);
    setAuthState((prev) => (prev ? { ...prev, isLoggedIn: true } : prev));
    setLoginModalOpen(false);
  }

  function handleLogout() {
    setOfflineSessionActive(false);
    setAuthState((prev) => (prev ? { ...prev, isLoggedIn: false } : prev));
  }

  async function handleUpdateAccount(
    namaLengkap: string,
    jabatan: string,
    username: string,
    newPassword?: string,
    requireLoginOnStart?: boolean
  ) {
    if (!authState) return;
    const passwordHash = newPassword
      ? await hashPasswordOffline(newPassword)
      : authState.account.passwordHash;
    const nextAccount = {
      namaLengkap,
      jabatan,
      username,
      passwordHash,
    };
    const nextRequire =
      requireLoginOnStart !== undefined ? requireLoginOnStart : authState.requireLoginOnStart;
    saveAuthConfig(nextAccount, nextRequire);
    setAuthState({
      account: nextAccount,
      isLoggedIn: authState.isLoggedIn,
      requireLoginOnStart: nextRequire,
    });
  }

  function handleUpdateAttachments(
    residentId: string,
    fotoUrl: string | undefined,
    dokumen: ResidentDocument[]
  ) {
    const now = new Date().toISOString();
    const next = residents.map((r) =>
      r.id === residentId ? { ...r, fotoUrl, dokumen, updatedAt: now } : r
    );
    persistResidents(next);
    if (viewingResident?.id === residentId) {
      setViewingResident((prev) => (prev ? { ...prev, fotoUrl, dokumen, updatedAt: now } : prev));
    }
  }

  function handleQuickCsvImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsvResidents(String(reader.result ?? ''));
      if (parsed.validRows.length === 0) {
        setQuickNotice({
          type: 'error',
          text:
            parsed.errors[0]?.message ??
            'Tidak ada baris valid yang dapat diimpor dari berkas CSV tersebut.',
        });
        return;
      }
      handleImportResidents(parsed.validRows, 'merge');
      setQuickNotice({
        type: 'success',
        text: `Berhasil mengimpor ${parsed.validRows.length} data penduduk dari "${file.name}".`,
      });
      setActiveView('buku-induk');
    };
    reader.onerror = () => {
      setQuickNotice({ type: 'error', text: 'Gagal membaca berkas CSV dari perangkat.' });
    };
    reader.readAsText(file, 'UTF-8');
  }

  function triggerDefaultPrint(mode: Exclude<PrintMode, 'none'>) {
    setPrintResidents(null);
    setPrintOptions({
      showLogo: appSettings.printShowLogo,
      showSignature: appSettings.printShowSignature,
      dateFormat: appSettings.dateFormat,
    });
    setPrintMode(mode);
  }

  function startAddNew() {
    setEditingResident(null);
    setActiveView('input-manual');
  }

  function startEdit(resident: Resident) {
    setEditingResident(resident);
    setActiveView('input-manual');
  }

  const attachingResident = useMemo(
    () => residents.find((r) => r.id === attachingResidentId) ?? null,
    [residents, attachingResidentId]
  );

  const isLocked = Boolean(authState?.requireLoginOnStart && !authState.isLoggedIn);

  const mainWidthClass =
    appSettings.screenWidth === 'compact'
      ? 'max-w-[1140px]'
      : appSettings.screenWidth === 'full'
      ? 'max-w-none'
      : 'max-w-[1400px]';

  return (
    <>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 no-print">
        <Sidebar
          activeView={activeView}
          onSelectView={(view) => {
            if (view !== 'input-manual') setEditingResident(null);
            setActiveView(view);
          }}
          totalResidents={residents.length}
          totalFamilies={totalFamilies}
          profile={profile}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu navigasi"
                className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {profile.namaDesa ? `Desa ${profile.namaDesa}` : 'Data Kependudukan Desa'} /{' '}
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {VIEW_TITLES[activeView]}
                  </span>
                </p>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  {VIEW_TITLES[activeView]}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <PWAInstallButton />

              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
              >
                {authState?.isLoggedIn ? (
                  <>
                    <UserCheck className="w-4 h-4 text-accent" />
                    <span className="max-w-[110px] truncate">{authState.account.namaLengkap}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span>Login</span>
                  </>
                )}
              </button>

              {activeView !== 'dashboard' && (
                <button
                  type="button"
                  onClick={startAddNew}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg btn-accent whitespace-nowrap shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah Penduduk</span>
                  <span className="sm:hidden">Tambah</span>
                </button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className={`flex-1 p-4 sm:p-6 ${mainWidthClass} w-full mx-auto flex flex-col`}>
            {!loaded ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-sm text-slate-500 dark:text-slate-400">
                Memuat data penduduk lokal...
              </div>
            ) : (
              <div className="flex-1">
                {appSettings.showQuickActionBar && activeView !== 'dashboard' && (
                  <QuickActionBar
                    residents={residents}
                    profile={profile}
                    onAddNew={startAddNew}
                    onCsvFileSelected={handleQuickCsvImport}
                    onPrintBukuInduk={() => triggerDefaultPrint('buku-induk')}
                    onPrintBlankTemplate={() => triggerDefaultPrint('blank-template')}
                  />
                )}

                {quickNotice && (
                  <div
                    role="status"
                    className={`mb-4 flex items-center justify-between gap-3 px-4 py-3 text-xs rounded-xl border ${
                      quickNotice.type === 'success'
                        ? 'btn-accent-soft'
                        : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {quickNotice.type === 'success' && (
                        <Check className="w-4 h-4 shrink-0 text-accent" />
                      )}
                      <span>{quickNotice.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuickNotice(null)}
                      aria-label="Tutup pemberitahuan"
                      className="p-1 hover:opacity-70"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {activeView === 'dashboard' && (
                  <DashboardView
                    residents={residents}
                    profile={profile}
                    tableDensity={appSettings.tableDensity}
                    onAddNew={startAddNew}
                    onViewAll={() => setActiveView('buku-induk')}
                    onViewResident={(r) => setViewingResident(r)}
                    onGoToTemplates={() => setActiveView('template-data')}
                    onLoadSampleData={handleLoadSampleData}
                  />
                )}

                {activeView === 'buku-induk' && (
                  <ResidentTable
                    residents={residents}
                    profile={profile}
                    settings={appSettings}
                    onAddNew={startAddNew}
                    onEdit={startEdit}
                    onView={(r) => setViewingResident(r)}
                    onManageAttachments={(r) => setAttachingResidentId(r.id)}
                    onDeleteMany={handleDeleteMany}
                    onGoToTemplates={() => setActiveView('template-data')}
                    onPrintBlankTemplate={() => triggerDefaultPrint('blank-template')}
                    onPrintBukuInduk={() => triggerDefaultPrint('buku-induk')}
                    onLoadSampleData={handleLoadSampleData}
                  />
                )}

                {activeView === 'input-manual' && (
                  <ResidentForm
                    initialData={editingResident}
                    existingResidents={residents}
                    profile={profile}
                    strictNikValidation={appSettings.strictNikValidation}
                    onSave={handleSaveResident}
                    onCancel={() => {
                      setEditingResident(null);
                      setActiveView('buku-induk');
                    }}
                  />
                )}

                {activeView === 'kartu-keluarga' && (
                  <FamilyCardsView
                    residents={residents}
                    dateFormat={appSettings.dateFormat}
                    onEditMember={startEdit}
                    onAddNew={startAddNew}
                  />
                )}

                {activeView === 'statistik' && (
                  <DemographicsView
                    residents={residents}
                    profile={profile}
                    dateFormat={appSettings.dateFormat}
                    onPrintRekapSemua={(filtered, columnMode, subtitleNote) => {
                      setPrintResidents(filtered);
                      setPrintOptions({
                        columnMode,
                        includeDemografi: true,
                        subtitleNote,
                        showLogo: appSettings.printShowLogo,
                        showSignature: appSettings.printShowSignature,
                        dateFormat: appSettings.dateFormat,
                      });
                      setPrintMode('rekap-semua');
                    }}
                    onPrintBukuInduk={(filtered, columnMode, subtitleNote) => {
                      setPrintResidents(filtered);
                      setPrintOptions({
                        columnMode,
                        subtitleNote,
                        showLogo: appSettings.printShowLogo,
                        showSignature: appSettings.printShowSignature,
                        dateFormat: appSettings.dateFormat,
                      });
                      setPrintMode('buku-induk');
                    }}
                    onPrintStatistik={() => triggerDefaultPrint('statistik')}
                    onAddNew={startAddNew}
                  />
                )}

                {activeView === 'print-data' && (
                  <PrintCenterView
                    residents={residents}
                    profile={profile}
                    settings={appSettings}
                    onTriggerPrint={(mode, filtered, opts) => {
                      setPrintResidents(mode === 'biodata-individu' ? residents : filtered);
                      setPrintOptions({
                        ...opts,
                        showLogo: appSettings.printShowLogo,
                        showSignature: appSettings.printShowSignature,
                        dateFormat: appSettings.dateFormat,
                      });
                      setPrintMode(mode);
                    }}
                  />
                )}

                {activeView === 'template-data' && (
                  <TemplatesAndBackupView
                    residents={residents}
                    profile={profile}
                    onImportResidents={handleImportResidents}
                    onRestoreBackup={handleRestoreBackup}
                    onClearAll={handleClearAll}
                    onPrintBlankTemplate={() => triggerDefaultPrint('blank-template')}
                  />
                )}

                {activeView === 'profil-desa' && (
                  <VillageProfileView profile={profile} onSaveProfile={persistProfile} />
                )}

                {activeView === 'pengaturan' && (
                  <SettingsView
                    settings={appSettings}
                    onUpdateSettings={handleUpdateSettings}
                  />
                )}
              </div>
            )}

            <footer className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Aplikasi Data Penduduk Desa Offline · Penyimpanan Lokal Perangkat
              </span>
              <span>
                Pengembang: <strong className="text-slate-700 dark:text-slate-200">Selpius Nabyal, S.Pd.Gr</strong>
              </span>
            </footer>
          </main>
        </div>
      </div>

      <ResidentDetailModal
        resident={viewingResident}
        dateFormat={appSettings.dateFormat}
        onClose={() => setViewingResident(null)}
        onEdit={startEdit}
        onManageAttachments={(r) => setAttachingResidentId(r.id)}
      />

      <ResidentAttachmentsModal
        resident={attachingResident}
        onClose={() => setAttachingResidentId(null)}
        onUpdateAttachments={handleUpdateAttachments}
      />

      {authState && (
        <LoginModal
          isOpen={loginModalOpen}
          isLockScreen={isLocked}
          authState={authState}
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onUpdateAccount={handleUpdateAccount}
        />
      )}

      <PrintViews
        mode={printMode}
        residents={printResidents ?? residents}
        profile={profile}
        options={printOptions}
      />
    </>
  );
}
