import { useState } from 'react';
import {
  Check,
  Maximize2,
  Minimize2,
  Monitor,
  Moon,
  Palette,
  Printer,
  RotateCcw,
  Sliders,
  Sun,
  Type,
} from 'lucide-react';
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  DateFormatMode,
  FONT_FAMILY_CSS,
  FontFamilyMode,
  FontSizeMode,
  PAPER_SIZE_CSS,
  PaperMarginMode,
  PaperOrientationMode,
  PaperSizeMode,
  ScreenColorMode,
  ScreenWidthMode,
  THEME_PRESETS,
  TableDensityMode,
} from '../types/settings';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
}

export function SettingsView({ settings, onUpdateSettings }: SettingsViewProps) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    typeof document !== 'undefined' && Boolean(document.fullscreenElement)
  );
  const [savedNotice, setSavedNotice] = useState(false);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    onUpdateSettings({ ...settings, [key]: value });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen may be blocked inside nested preview iframes
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Pengaturan Aplikasi & Tampilan
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Semua perubahan langsung diterapkan dan tersimpan otomatis di perangkat Anda secara
            offline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
              <Check className="w-3.5 h-3.5" />
              Tersimpan
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              onUpdateSettings(DEFAULT_APP_SETTINGS);
              setSavedNotice(true);
              setTimeout(() => setSavedNotice(false), 2000);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Pengaturan
          </button>
        </div>
      </div>

      {/* 01. Tema Warna Aplikasi */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Palette className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            01. Tema Warna Utama Aplikasi
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => {
            const active = settings.themeColor === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => update('themeColor', preset.id)}
                className={`p-3.5 rounded-xl border text-left transition-colors flex items-start gap-3 ${
                  active
                    ? 'border-accent bg-slate-50 dark:bg-slate-800/80'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-md shrink-0 mt-0.5 border border-black/10"
                  style={{ backgroundColor: preset.accent }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {preset.name}
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {preset.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 02. Pengaturan Layar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Monitor className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              02. Layar & Tampilan Workspace
            </h3>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                Keluar Layar Penuh
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                Mode Layar Penuh
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Mode Terang / Gelap */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Mode Pencahayaan Layar
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              {(
                [
                  { id: 'light', label: 'Terang', Icon: Sun },
                  { id: 'dark', label: 'Gelap', Icon: Moon },
                  { id: 'system', label: 'Sistem', Icon: Monitor },
                ] as { id: ScreenColorMode; label: string; Icon: typeof Sun }[]
              ).map((opt) => {
                const active = settings.colorMode === opt.id;
                const Icon = opt.Icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update('colorMode', opt.id)}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-md font-medium transition-colors ${
                      active
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lebar Area Kerja */}
          <div className="space-y-2">
            <label
              htmlFor="set-screen-width"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Lebar Area Konten Layar
            </label>
            <select
              id="set-screen-width"
              value={settings.screenWidth}
              onChange={(e) => update('screenWidth', e.target.value as ScreenWidthMode)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="standard">Standar (1400px)</option>
              <option value="compact">Rapat Terpusat (1140px)</option>
              <option value="full">Lebar Penuh (100% Layar)</option>
            </select>
          </div>

          {/* Kepadatan Tabel */}
          <div className="space-y-2">
            <label
              htmlFor="set-table-density"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Kepadatan Baris Tabel
            </label>
            <select
              id="set-table-density"
              value={settings.tableDensity}
              onChange={(e) => update('tableDensity', e.target.value as TableDensityMode)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="normal">Normal (Lega)</option>
              <option value="compact">Kompak (Muat Banyak Baris)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 03. Ukuran & Bentuk Huruf */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Type className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            03. Ukuran Huruf & Bentuk Huruf (Tipografi)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Ukuran Huruf Aplikasi
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              {(
                [
                  { id: 'small', label: 'Kecil' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'large', label: 'Besar' },
                  { id: 'xlarge', label: 'Ekstra' },
                ] as { id: FontSizeMode; label: string }[]
              ).map((opt) => {
                const active = settings.fontSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update('fontSize', opt.id)}
                    className={`py-1.5 rounded-md font-medium transition-colors ${
                      active
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="set-font-family"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Bentuk Huruf (Jenis Font)
            </label>
            <select
              id="set-font-family"
              value={settings.fontFamily}
              onChange={(e) => update('fontFamily', e.target.value as FontFamilyMode)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="jakarta">Plus Jakarta Sans (Modern Rapi)</option>
              <option value="public">Public Sans (Standar Administrasi)</option>
              <option value="lora">Lora Serif (Klasik Dokumen Resmi)</option>
              <option value="mono">JetBrains Mono (Tegas / Angka Lurus)</option>
            </select>
          </div>
        </div>

        <div
          className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1"
          style={{ fontFamily: FONT_FAMILY_CSS[settings.fontFamily] }}
        >
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Pratinjau Bentuk & Ukuran Huruf: Buku Induk Penduduk Desa
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            NIK 3201151405820001 · Budi Santoso · Dusun Krajan RT 001 / RW 001
          </p>
        </div>
      </section>

      {/* 04. Pengaturan Kertas & Cetak */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Printer className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            04. Pengaturan Kertas & Tata Letak Cetak
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="set-paper-size"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Ukuran Kertas
            </label>
            <select
              id="set-paper-size"
              value={settings.paperSize}
              onChange={(e) => update('paperSize', e.target.value as PaperSizeMode)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              {(Object.keys(PAPER_SIZE_CSS) as PaperSizeMode[]).map((k) => (
                <option key={k} value={k}>
                  {PAPER_SIZE_CSS[k].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="set-paper-orient"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Orientasi Kertas
            </label>
            <select
              id="set-paper-orient"
              value={settings.paperOrientation}
              onChange={(e) => update('paperOrientation', e.target.value as PaperOrientationMode)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="landscape">Landscape (Mendatar)</option>
              <option value="portrait">Portrait (Tegak)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="set-paper-margin"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Margin Cetak
            </label>
            <select
              id="set-paper-margin"
              value={settings.paperMargin}
              onChange={(e) => update('paperMargin', e.target.value as PaperMarginMode)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="narrow">Sempit (8 mm)</option>
              <option value="standard">Standar (12 mm)</option>
              <option value="wide">Lebar (18 mm)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <label className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs cursor-pointer">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Tampilkan Logo Desa di Dokumen Cetak
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Sertakan logo pada kop laporan cetak
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.printShowLogo}
              onChange={(e) => update('printShowLogo', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>

          <label className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs cursor-pointer">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Sertakan Kolom Tanda Tangan
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Kolom pengesahan Kepala Desa & Sekretaris
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.printShowSignature}
              onChange={(e) => update('printShowSignature', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
        </div>
      </section>

      {/* 05. Pengaturan Data & Operasional Lainnya */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            05. Pengaturan Data, Tabel & Validasi Lainnya
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="set-rows-page"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Jumlah Baris per Halaman Tabel
            </label>
            <select
              id="set-rows-page"
              value={settings.rowsPerPage}
              onChange={(e) =>
                update('rowsPerPage', Number(e.target.value) as AppSettings['rowsPerPage'])
              }
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value={10}>10 baris</option>
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="set-date-fmt"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Format Tanggal Lahir di Tabel
            </label>
            <select
              id="set-date-fmt"
              value={settings.dateFormat}
              onChange={(e) => update('dateFormat', e.target.value as DateFormatMode)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              <option value="dd/mm/yyyy">DD/MM/YYYY (contoh: 14/05/1982)</option>
              <option value="dd-mmm-yyyy">DD Bulan YYYY (contoh: 14 Mei 1982)</option>
              <option value="yyyy-mm-dd">YYYY-MM-DD (contoh: 1982-05-14)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs cursor-pointer">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Tampilkan Bilah Aksi Cepat
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Tampilkan tombol Impor/Ekspor cepat di atas setiap menu
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showQuickActionBar}
              onChange={(e) => update('showQuickActionBar', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>

          <label className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs cursor-pointer">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Validasi Ketat 16 Digit NIK
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Wajibkan tepat 16 angka NIK saat input manual
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.strictNikValidation}
              onChange={(e) => update('strictNikValidation', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
