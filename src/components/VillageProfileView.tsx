import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Check, ImagePlus, Plus, Save, Trash2, X } from 'lucide-react';
import { VillageProfile } from '../types/population';
import { compressImageToDataUrl } from '../lib/fileHelpers';

interface VillageProfileViewProps {
  profile: VillageProfile;
  onSaveProfile: (profile: VillageProfile) => void;
}

export function VillageProfileView({ profile, onSaveProfile }: VillageProfileViewProps) {
  const [form, setForm] = useState<VillageProfile>(profile);
  const [newDusun, setNewDusun] = useState('');
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState('');

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  async function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');

    if (!file.type.startsWith('image/')) {
      setLogoError('Berkas logo harus berupa gambar (PNG, JPG, WebP, atau SVG).');
      e.target.value = '';
      return;
    }

    try {
      const dataUrl = await compressImageToDataUrl(file, 360, 0.9);
      const next = { ...form, logoUrl: dataUrl };
      setForm(next);
      onSaveProfile(next);
    } catch {
      setLogoError('Gagal memproses gambar logo desa.');
    }
    e.target.value = '';
  }

  function handleRemoveLogo() {
    const next = { ...form, logoUrl: undefined };
    setForm(next);
    onSaveProfile(next);
  }

  function handleAddDusun() {
    const clean = newDusun.trim();
    if (!clean) return;
    if (!form.daftarDusun.includes(clean)) {
      setForm((prev) => ({ ...prev, daftarDusun: [...prev.daftarDusun, clean] }));
    }
    setNewDusun('');
  }

  function handleRemoveDusun(name: string) {
    setForm((prev) => ({
      ...prev,
      daftarDusun: prev.daftarDusun.filter((d) => d !== name),
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSaveProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 max-w-3xl"
    >
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Identitas & Wilayah Desa
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Logo dan identitas ini ditampilkan pada bilah menu, kop cetak Buku Induk Penduduk,
          Formulir Kosong, dan Laporan Rekapitulasi Desa.
        </p>
      </div>

      {saved && (
        <div
          role="status"
          className="flex items-center gap-2 px-4 py-3 text-sm rounded-lg btn-accent-soft"
        >
          <Check className="w-4 h-4 shrink-0 text-accent" />
          <span>Profil desa berhasil disimpan secara lokal.</span>
        </div>
      )}

      {/* Upload Logo Desa */}
      <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Logo Desa"
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <ImagePlus className="w-7 h-7 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-[220px]">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Logo / Lambang Desa
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Unggah lambang kabupaten atau logo resmi desa (PNG/JPG). Disimpan otomatis secara
              offline di perangkat Anda.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg btn-accent cursor-pointer whitespace-nowrap">
                <ImagePlus className="w-3.5 h-3.5" />
                {form.logoUrl ? 'Ganti Logo Desa' : 'Upload Logo Desa'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="sr-only"
                />
              </label>
              {form.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Logo
                </button>
              )}
            </div>
          </div>
        </div>
        {logoError && <p className="text-xs text-red-700 dark:text-red-400">{logoError}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="prof-desa" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Nama Desa / Kelurahan
          </label>
          <input
            id="prof-desa"
            type="text"
            value={form.namaDesa}
            onChange={(e) => setForm((p) => ({ ...p, namaDesa: e.target.value }))}
            placeholder="Contoh: Sukamaju"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
          />
        </div>

        <div>
          <label htmlFor="prof-kode" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Kode Wilayah Desa (Kemendagri)
          </label>
          <input
            id="prof-kode"
            type="text"
            value={form.kodeDesa}
            onChange={(e) => setForm((p) => ({ ...p, kodeDesa: e.target.value }))}
            placeholder="Contoh: 32.01.15.2004"
            className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
          />
        </div>

        <div>
          <label htmlFor="prof-kec" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Kecamatan
          </label>
          <input
            id="prof-kec"
            type="text"
            value={form.kecamatan}
            onChange={(e) => setForm((p) => ({ ...p, kecamatan: e.target.value }))}
            placeholder="Nama Kecamatan"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
          />
        </div>

        <div>
          <label htmlFor="prof-kab" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Kabupaten / Kota
          </label>
          <input
            id="prof-kab"
            type="text"
            value={form.kabupaten}
            onChange={(e) => setForm((p) => ({ ...p, kabupaten: e.target.value }))}
            placeholder="Nama Kabupaten/Kota"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
          />
        </div>

        <div>
          <label htmlFor="prof-prov" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Provinsi
          </label>
          <input
            id="prof-prov"
            type="text"
            value={form.provinsi}
            onChange={(e) => setForm((p) => ({ ...p, provinsi: e.target.value }))}
            placeholder="Nama Provinsi"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
          />
        </div>

        <div>
          <label htmlFor="prof-tahun" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Tahun Buku Pendataan
          </label>
          <input
            id="prof-tahun"
            type="text"
            maxLength={4}
            value={form.tahunBuku}
            onChange={(e) =>
              setForm((p) => ({ ...p, tahunBuku: e.target.value.replace(/[^\d]/g, '') }))
            }
            className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
          />
        </div>

        <div>
          <label htmlFor="prof-kades" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Nama Kepala Desa
          </label>
          <input
            id="prof-kades"
            type="text"
            value={form.kepalaDesa}
            onChange={(e) => setForm((p) => ({ ...p, kepalaDesa: e.target.value }))}
            placeholder="Untuk tanda tangan laporan cetak"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
          />
        </div>

        <div>
          <label htmlFor="prof-sekdes" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Nama Sekretaris Desa / Operator
          </label>
          <input
            id="prof-sekdes"
            type="text"
            value={form.sekretarisDesa}
            onChange={(e) => setForm((p) => ({ ...p, sekretarisDesa: e.target.value }))}
            placeholder="Opsional"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div>
          <label htmlFor="prof-dusun-input" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Daftar Nama Dusun / Kampung (untuk pilihan cepat saat input manual)
          </label>
        </div>

        <div className="flex gap-2">
          <input
            id="prof-dusun-input"
            type="text"
            value={newDusun}
            onChange={(e) => setNewDusun(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddDusun();
              }
            }}
            placeholder="Tambah nama dusun..."
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
          />
          <button
            type="button"
            onClick={handleAddDusun}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </button>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          {form.daftarDusun.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
              Belum ada daftar dusun.
            </p>
          ) : (
            form.daftarDusun.map((d) => (
              <div key={d} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-slate-800 dark:text-slate-200">{d}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDusun(d)}
                  aria-label={`Hapus ${d}`}
                  className="p-1 text-slate-400 hover:text-red-700 dark:hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pengembang: <strong className="text-slate-800 dark:text-slate-200">Selpius Nabyal, S.Pd.Gr</strong>
        </p>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg btn-accent"
        >
          <Save className="w-4 h-4" />
          Simpan Profil Desa
        </button>
      </div>
    </form>
  );
}
