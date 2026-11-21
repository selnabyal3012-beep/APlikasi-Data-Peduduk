import { FormEvent, useState } from 'react';
import { Check, KeyRound, Lock, LogOut, ShieldCheck, X } from 'lucide-react';
import { OfflineAuthState, hashPasswordOffline } from '../lib/offlineAuth';

interface LoginModalProps {
  isOpen: boolean;
  isLockScreen: boolean;
  authState: OfflineAuthState;
  onClose: () => void;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onUpdateAccount: (
    namaLengkap: string,
    jabatan: string,
    username: string,
    newPassword?: string,
    requireLoginOnStart?: boolean
  ) => Promise<void>;
}

export function LoginModal({
  isOpen,
  isLockScreen,
  authState,
  onClose,
  onLoginSuccess,
  onLogout,
  onUpdateAccount,
}: LoginModalProps) {
  const [username, setUsername] = useState(authState.account.username);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Account settings state (when already logged in)
  const [tab, setTab] = useState<'status' | 'settings'>('status');
  const [editNama, setEditNama] = useState(authState.account.namaLengkap);
  const [editJabatan, setEditJabatan] = useState(authState.account.jabatan);
  const [editUsername, setEditUsername] = useState(authState.account.username);
  const [editPassword, setEditPassword] = useState('');
  const [requireOnStart, setRequireOnStart] = useState(authState.requireLoginOnStart);
  const [savedNotice, setSavedNotice] = useState('');

  if (!isOpen && !isLockScreen) return null;

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const cleanUser = username.trim().toLowerCase();
    const expectedUser = authState.account.username.trim().toLowerCase();
    const enteredHash = await hashPasswordOffline(password);

    if (cleanUser !== expectedUser || enteredHash !== authState.account.passwordHash) {
      setError('Nama pengguna atau kata sandi salah.');
      return;
    }

    setPassword('');
    onLoginSuccess();
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!editUsername.trim() || !editNama.trim()) {
      setError('Nama lengkap dan username operator wajib diisi.');
      return;
    }
    setError('');
    await onUpdateAccount(
      editNama.trim(),
      editJabatan.trim() || 'Perangkat Desa',
      editUsername.trim(),
      editPassword.trim() ? editPassword : undefined,
      requireOnStart
    );
    setEditPassword('');
    setSavedNotice('Pengaturan akun operator lokal berhasil disimpan.');
    setTimeout(() => setSavedNotice(''), 3500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 no-print">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-accent" />
            <div>
              <h2 id="login-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {authState.isLoggedIn && !isLockScreen
                  ? 'Akun Operator Desa (Offline)'
                  : 'Login Operator Desa (Offline)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Autentikasi lokal perangkat tanpa koneksi internet
              </p>
            </div>
          </div>
          {!isLockScreen && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup jendela login"
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!authState.isLoggedIn || isLockScreen ? (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {error && (
              <div
                role="alert"
                className="px-3.5 py-2.5 text-xs text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-user" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Username Operator
              </label>
              <input
                id="login-user"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              />
            </div>

            <div>
              <label htmlFor="login-pass" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Kata Sandi / PIN
              </label>
              <input
                id="login-pass"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Akses bawaan awal:</strong> Username{' '}
              <code className="font-mono text-slate-900 dark:text-white">admin</code> · Sandi{' '}
              <code className="font-mono text-slate-900 dark:text-white">admin123</code>. Anda dapat mengganti
              kata sandi setelah masuk.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {!isLockScreen && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium btn-accent rounded-lg"
              >
                <ShieldCheck className="w-4 h-4" />
                Masuk ke Aplikasi
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setTab('status')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  tab === 'status'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sesi Aktif
              </button>
              <button
                type="button"
                onClick={() => setTab('settings')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  tab === 'settings'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Ubah Akun & Sandi
              </button>
            </div>

            {tab === 'status' ? (
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Masuk sebagai</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {authState.account.namaLengkap}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {authState.account.jabatan} · Username:{' '}
                    <span className="font-mono text-slate-900 dark:text-white">
                      {authState.account.username}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      Kunci Aplikasi Saat Dibuka
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Minta login setiap aplikasi dibuka di PC desa
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    aria-label="Kunci aplikasi saat dibuka"
                    checked={authState.requireLoginOnStart}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      setRequireOnStart(nextVal);
                      void onUpdateAccount(
                        authState.account.namaLengkap,
                        authState.account.jabatan,
                        authState.account.username,
                        undefined,
                        nextVal
                      );
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/60"
                  >
                    {authState.requireLoginOnStart ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Kunci & Keluar
                      </>
                    ) : (
                      <>
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar Sesi
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium btn-accent rounded-lg"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-3.5">
                {error && (
                  <div className="px-3 py-2 text-xs text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
                    {error}
                  </div>
                )}
                {savedNotice && (
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs btn-accent-soft rounded-lg">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{savedNotice}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Operator
                  </label>
                  <input
                    type="text"
                    required
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={editJabatan}
                      onChange={(e) => setEditJabatan(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kata Sandi Baru (kosongkan jika tidak diubah)
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Minimal 4 karakter..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium btn-accent rounded-lg"
                  >
                    Simpan Akun
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
