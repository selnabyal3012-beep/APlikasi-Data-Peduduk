import { useState } from 'react';
import { Check, Laptop, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) {
    return null;
  }

  async function handleClick() {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
      }
      return;
    }
    setShowGuide(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium btn-accent-soft rounded-lg hover:opacity-90 whitespace-nowrap shrink-0 transition-opacity"
      >
        {justInstalled ? (
          <>
            <Check className="w-4 h-4" />
            <span>Terinstal</span>
          </>
        ) : (
          <>
            <Laptop className="w-4 h-4" />
            <span>Instal di PC</span>
          </>
        )}
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 no-print">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="pwa-guide-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Instal Aplikasi Offline di PC / Laptop
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Agar aplikasi terbuka seperti program Windows/Mac tanpa koneksi internet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup panduan instalasi"
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              {isIOS ? (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Panduan untuk iPhone / iPad (Safari):
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs leading-relaxed">
                    <li>Ketuk ikon <strong>Bagikan (Share)</strong> di bilah Safari.</li>
                    <li>Pilih menu <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</li>
                    <li>Ketuk <strong>Tambah</strong>. Aplikasi siap dibuka secara offline.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  {isInIframe && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      Anda sedang membuka aplikasi di dalam jendela pratinjau. Browser membatasi
                      instalasi langsung dari dalam frame—buka tautan aplikasi ini di{' '}
                      <strong>tab browser penuh (Google Chrome atau Microsoft Edge)</strong> agar
                      tombol instal langsung muncul.
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Cara Instal di PC / Laptop (Chrome atau Microsoft Edge):
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      <li>
                        Buka aplikasi ini langsung di tab penuh Google Chrome atau Microsoft Edge.
                      </li>
                      <li>
                        Klik tombol <strong>Instal di PC</strong> di pojok kanan atas, atau klik ikon{' '}
                        <strong>Instal Aplikasi (layar dengan panah)</strong> di ujung kanan bilah
                        alamat URL.
                      </li>
                      <li>
                        Bisa juga melalui menu browser <strong>⋮</strong> (kanan atas) →{' '}
                        <strong>Simpan dan bagikan</strong> →{' '}
                        <strong>Instal halaman sebagai aplikasi...</strong>
                      </li>
                      <li>
                        Setelah terinstal, pintasan <strong>Buku Induk Desa Offline</strong> akan
                        muncul di Desktop / Start Menu dan tetap berjalan penuh walau Wi-Fi dimatikan.
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 text-xs font-medium btn-accent rounded-lg"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
