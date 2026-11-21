import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  Check,
  Download,
  FileText,
  ImagePlus,
  Paperclip,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  BLOOD_TYPE_OPTIONS,
  CITIZENSHIP_OPTIONS,
  COMMON_OCCUPATIONS,
  EDUCATION_OPTIONS,
  FAMILY_ROLE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELIGION_OPTIONS,
  RESIDENCY_STATUS_OPTIONS,
  Resident,
  ResidentDocument,
  VillageProfile,
} from '../types/population';
import { calculateAge } from '../lib/demographics';
import {
  compressImageToDataUrl,
  downloadDataUrl,
  formatFileSize,
  readFileAsDataUrl,
} from '../lib/fileHelpers';

interface ResidentFormProps {
  initialData?: Resident | null;
  existingResidents: Resident[];
  profile: VillageProfile;
  strictNikValidation?: boolean;
  onSave: (resident: Resident, addAnother: boolean) => void;
  onCancel?: () => void;
}

type FormState = Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>;

function createBlankState(defaultDusun: string): FormState {
  return {
    noKk: '',
    nik: '',
    namaLengkap: '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: '',
    tanggalLahir: '',
    agama: 'Islam',
    pendidikan: 'SLTA/Sederajat',
    pekerjaan: 'Belum/Tidak Bekerja',
    statusPerkawinan: 'Belum Kawin',
    hubunganKeluarga: 'Kepala Keluarga',
    kewarganegaraan: 'WNI',
    golonganDarah: 'Tidak Tahu',
    namaAyah: '',
    namaIbu: '',
    dusun: defaultDusun,
    rt: '',
    rw: '',
    alamat: '',
    statusKependudukan: 'Tetap',
    keterangan: '',
    fotoUrl: undefined,
    dokumen: [],
  };
}

export function ResidentForm({
  initialData,
  existingResidents,
  profile,
  strictNikValidation = false,
  onSave,
  onCancel,
}: ResidentFormProps) {
  const defaultDusun = profile.daftarDusun[0] ?? '';
  const [form, setForm] = useState<FormState>(() =>
    initialData ? { ...initialData, dokumen: initialData.dokumen ?? [] } : createBlankState(defaultDusun)
  );
  const [customOccupation, setCustomOccupation] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData, dokumen: initialData.dokumen ?? [] });
      setCustomOccupation(!COMMON_OCCUPATIONS.includes(initialData.pekerjaan));
      setErrorMsg('');
    } else {
      setForm(createBlankState(defaultDusun));
      setCustomOccupation(false);
    }
  }, [initialData, defaultDusun]);

  const isEditing = Boolean(initialData);
  const agePreview = calculateAge(form.tanggalLahir);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg('');
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Foto penduduk harus berupa berkas gambar (JPG, PNG, WebP).');
      e.target.value = '';
      return;
    }
    try {
      const compressed = await compressImageToDataUrl(file, 640, 0.85);
      updateField('fotoUrl', compressed);
    } catch {
      setErrorMsg('Gagal memproses foto penduduk.');
    }
    e.target.value = '';
  }

  async function handleDocsUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const added: ResidentDocument[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`Berkas "${file.name}" melebihi batas 5 MB.`);
        continue;
      }
      try {
        const dataUrl = file.type.startsWith('image/')
          ? await compressImageToDataUrl(file, 1400, 0.85)
          : await readFileAsDataUrl(file);
        added.push({
          id: crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}-${Math.random()}`,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        });
      } catch {
        setErrorMsg(`Gagal membaca berkas "${file.name}".`);
      }
    }

    if (added.length > 0) {
      updateField('dokumen', [...(form.dokumen ?? []), ...added]);
    }
    e.target.value = '';
  }

  function handleSubmit(e: FormEvent, addAnother: boolean) {
    e.preventDefault();

    const cleanNik = form.nik.replace(/\s+/g, '');
    const cleanKk = form.noKk.replace(/\s+/g, '');
    const cleanName = form.namaLengkap.trim();

    if (!cleanName) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    if (!cleanNik) {
      setErrorMsg('NIK wajib diisi.');
      return;
    }

    if (strictNikValidation) {
      if (!/^\d{16}$/.test(cleanNik)) {
        setErrorMsg('Validasi Ketat Aktif: NIK harus tepat 16 digit angka.');
        return;
      }
      if (cleanKk && !/^\d{16}$/.test(cleanKk)) {
        setErrorMsg('Validasi Ketat Aktif: Nomor KK harus tepat 16 digit angka.');
        return;
      }
    }

    const duplicate = existingResidents.find(
      (r) => r.nik === cleanNik && r.id !== initialData?.id
    );
    if (duplicate) {
      setErrorMsg(`NIK ${cleanNik} sudah terdaftar atas nama ${duplicate.namaLengkap}.`);
      return;
    }

    const now = new Date().toISOString();
    const record: Resident = {
      ...form,
      id: initialData?.id ?? (crypto.randomUUID ? crypto.randomUUID() : `res-${Date.now()}`),
      noKk: cleanKk,
      nik: cleanNik,
      namaLengkap: cleanName,
      tempatLahir: form.tempatLahir.trim(),
      pekerjaan: form.pekerjaan.trim() || 'Belum/Tidak Bekerja',
      namaAyah: form.namaAyah.trim(),
      namaIbu: form.namaIbu.trim(),
      dusun: form.dusun.trim(),
      rt: form.rt.trim() ? form.rt.trim().padStart(3, '0') : '',
      rw: form.rw.trim() ? form.rw.trim().padStart(3, '0') : '',
      alamat: form.alamat.trim(),
      keterangan: form.keterangan.trim(),
      createdAt: initialData?.createdAt ?? now,
      updatedAt: now,
    };

    onSave(record, addAnother);

    if (addAnother && !isEditing) {
      // Keep KK, Dusun, RT, RW, Alamat so adding members of the same family is super fast
      setForm((prev) => ({
        ...createBlankState(prev.dusun),
        noKk: prev.noKk,
        dusun: prev.dusun,
        rt: prev.rt,
        rw: prev.rw,
        alamat: prev.alamat,
        hubunganKeluarga: 'Anak',
      }));
      setCustomOccupation(false);
      setSavedNotice(`Data "${cleanName}" tersimpan. Silakan lanjut isi anggota berikutnya.`);
      setTimeout(() => setSavedNotice(''), 4000);
    }
  }

  function handleResetBlank() {
    setForm(createBlankState(defaultDusun));
    setCustomOccupation(false);
    setErrorMsg('');
    setSavedNotice('');
  }

  const dusunOptions = Array.from(
    new Set([...profile.daftarDusun, form.dusun].filter((d) => d.trim().length > 0))
  );

  return (
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isEditing ? `Ubah Data Penduduk: ${initialData?.namaLengkap}` : 'Formulir Input Manual Penduduk'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Isi biodata penduduk secara manual sesuai Kartu Keluarga (KK) atau KTP.
          </p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={handleResetBlank}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Bersihkan Formulir
          </button>
        )}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="px-4 py-3 text-sm text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg"
        >
          {errorMsg}
        </div>
      )}

      {savedNotice && (
        <div
          role="status"
          className="flex items-center gap-2 px-4 py-3 text-sm rounded-lg btn-accent-soft"
        >
          <Check className="w-4 h-4 shrink-0 text-accent" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Bagian 1: Identitas Kependudukan */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          01. Identitas Pokok & Keluarga
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="field-noKk" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nomor Kartu Keluarga (No. KK)
            </label>
            <input
              id="field-noKk"
              type="text"
              inputMode="numeric"
              maxLength={20}
              value={form.noKk}
              onChange={(e) => updateField('noKk', e.target.value.replace(/[^\d]/g, ''))}
              placeholder="Contoh: 3201151204080001"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {form.noKk.length}/16 digit
            </p>
          </div>

          <div>
            <label htmlFor="field-nik" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              NIK <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="field-nik"
              type="text"
              inputMode="numeric"
              maxLength={20}
              required
              value={form.nik}
              onChange={(e) => updateField('nik', e.target.value.replace(/[^\d]/g, ''))}
              placeholder="16 digit NIK sesuai KTP/KK"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {form.nik.length}/16 digit
            </p>
          </div>

          <div>
            <label htmlFor="field-nama" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Lengkap <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="field-nama"
              type="text"
              required
              value={form.namaLengkap}
              onChange={(e) => updateField('namaLengkap', e.target.value)}
              placeholder="Sesuai akta / KTP"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            />
          </div>

          <div>
            <label htmlFor="field-jk" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Jenis Kelamin
            </label>
            <select
              id="field-jk"
              value={form.jenisKelamin}
              onChange={(e) => updateField('jenisKelamin', e.target.value as Resident['jenisKelamin'])}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="field-tempat" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tempat Lahir
            </label>
            <input
              id="field-tempat"
              type="text"
              value={form.tempatLahir}
              onChange={(e) => updateField('tempatLahir', e.target.value)}
              placeholder="Kabupaten / Kota kelahiran"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            />
          </div>

          <div>
            <label htmlFor="field-tgl" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tanggal Lahir{' '}
              {agePreview !== null && (
                <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  ({agePreview} th)
                </span>
              )}
            </label>
            <input
              id="field-tgl"
              type="date"
              value={form.tanggalLahir}
              onChange={(e) => updateField('tanggalLahir', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            />
          </div>
        </div>
      </section>

      <hr className="border-slate-200 dark:border-slate-800" />

      {/* Bagian 2: Biodata Sosial & Hubungan Keluarga */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          02. Status Sosial, Pendidikan & Pekerjaan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="field-agama" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Agama
            </label>
            <select
              id="field-agama"
              value={form.agama}
              onChange={(e) => updateField('agama', e.target.value as Resident['agama'])}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              {RELIGION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="field-pendidikan" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Pendidikan Terakhir
            </label>
            <select
              id="field-pendidikan"
              value={form.pendidikan}
              onChange={(e) => updateField('pendidikan', e.target.value as Resident['pendidikan'])}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="field-pekerjaan" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Pekerjaan
            </label>
            {!customOccupation ? (
              <select
                id="field-pekerjaan"
                value={COMMON_OCCUPATIONS.includes(form.pekerjaan) ? form.pekerjaan : 'Lainnya'}
                onChange={(e) => {
                  if (e.target.value === 'Lainnya') {
                    setCustomOccupation(true);
                    updateField('pekerjaan', '');
                  } else {
                    updateField('pekerjaan', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              >
                {COMMON_OCCUPATIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  id="field-pekerjaan"
                  type="text"
                  value={form.pekerjaan}
                  onChange={(e) => updateField('pekerjaan', e.target.value)}
                  placeholder="Ketik pekerjaan..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomOccupation(false);
                    updateField('pekerjaan', 'Belum/Tidak Bekerja');
                  }}
                  className="px-2.5 py-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
                >
                  Daftar
                </button>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="field-kawin" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Status Perkawinan
            </label>
            <select
              id="field-kawin"
              value={form.statusPerkawinan}
              onChange={(e) =>
                updateField('statusPerkawinan', e.target.value as Resident['statusPerkawinan'])
              }
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              {MARITAL_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="field-shdk" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Hubungan dalam Keluarga (SHDK)
            </label>
            <select
              id="field-shdk"
              value={form.hubunganKeluarga}
              onChange={(e) =>
                updateField('hubunganKeluarga', e.target.value as Resident['hubunganKeluarga'])
              }
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              {FAMILY_ROLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="field-wn" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Kewarganegaraan
              </label>
              <select
                id="field-wn"
                value={form.kewarganegaraan}
                onChange={(e) =>
                  updateField('kewarganegaraan', e.target.value as Resident['kewarganegaraan'])
                }
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              >
                {CITIZENSHIP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="field-darah" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Gol. Darah
              </label>
              <select
                id="field-darah"
                value={form.golonganDarah}
                onChange={(e) =>
                  updateField('golonganDarah', e.target.value as Resident['golonganDarah'])
                }
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              >
                {BLOOD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="field-ayah" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Ayah
            </label>
            <input
              id="field-ayah"
              type="text"
              value={form.namaAyah}
              onChange={(e) => updateField('namaAyah', e.target.value)}
              placeholder="Opsional"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            />
          </div>

          <div>
            <label htmlFor="field-ibu" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Ibu
            </label>
            <input
              id="field-ibu"
              type="text"
              value={form.namaIbu}
              onChange={(e) => updateField('namaIbu', e.target.value)}
              placeholder="Opsional"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            />
          </div>
        </div>
      </section>

      <hr className="border-slate-200 dark:border-slate-800" />

      {/* Bagian 3: Wilayah Domisili & Status */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          03. Alamat Wilayah & Status Kependudukan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="field-dusun" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Dusun / Kampung
            </label>
            {dusunOptions.length > 0 ? (
              <input
                id="field-dusun"
                list="dusun-list"
                type="text"
                value={form.dusun}
                onChange={(e) => updateField('dusun', e.target.value)}
                placeholder="Pilih atau ketik dusun"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              />
            ) : (
              <input
                id="field-dusun"
                type="text"
                value={form.dusun}
                onChange={(e) => updateField('dusun', e.target.value)}
                placeholder="Nama dusun"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              />
            )}
            <datalist id="dusun-list">
              {dusunOptions.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="field-rt" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                RT
              </label>
              <input
                id="field-rt"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={form.rt}
                onChange={(e) => updateField('rt', e.target.value.replace(/[^\d]/g, ''))}
                placeholder="001"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              />
            </div>
            <div>
              <label htmlFor="field-rw" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                RW
              </label>
              <input
                id="field-rw"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={form.rw}
                onChange={(e) => updateField('rw', e.target.value.replace(/[^\d]/g, ''))}
                placeholder="001"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="field-alamat" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Alamat Lengkap (Jalan / Gang / No. Rumah)
            </label>
            <input
              id="field-alamat"
              type="text"
              value={form.alamat}
              onChange={(e) => updateField('alamat', e.target.value)}
              placeholder="Contoh: Jl. Melati No. 05"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            />
          </div>

          <div>
            <label htmlFor="field-status" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Status Kependudukan
            </label>
            <select
              id="field-status"
              value={form.statusKependudukan}
              onChange={(e) =>
                updateField(
                  'statusKependudukan',
                  e.target.value as Resident['statusKependudukan']
                )
              }
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            >
              {RESIDENCY_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="field-ket" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Keterangan / Catatan Tambahan
            </label>
            <input
              id="field-ket"
              type="text"
              value={form.keterangan}
              onChange={(e) => updateField('keterangan', e.target.value)}
              placeholder="Contoh: Penerima BLT, Lansia, Disabilitas, KIS (opsional)"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus-accent"
            />
          </div>
        </div>
      </section>

      <hr className="border-slate-200 dark:border-slate-800" />

      {/* Bagian 4: Foto & Dokumen Pendukung */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            04. Foto Penduduk & Dokumen Pendukung (Opsional)
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Unggah pas foto penduduk serta salinan KK, KTP, atau Akta Kelahiran (disimpan offline di
            perangkat).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upload Foto */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 flex items-center gap-4">
            <div className="w-20 h-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
              {form.fotoUrl ? (
                <img
                  src={form.fotoUrl}
                  alt="Preview Foto Penduduk"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImagePlus className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Foto Penduduk (JPG / PNG)
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg btn-accent cursor-pointer whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  {form.fotoUrl ? 'Ganti Foto' : 'Upload Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="sr-only"
                  />
                </label>
                {form.fotoUrl && (
                  <button
                    type="button"
                    onClick={() => updateField('fotoUrl', undefined)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Upload Dokumen */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Dokumen (KTP / KK / Akta / PDF)
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg btn-accent-soft cursor-pointer whitespace-nowrap">
                <Paperclip className="w-3.5 h-3.5" />
                Upload Dokumen
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleDocsUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {(form.dokumen ?? []).length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Belum ada dokumen dilampirkan.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg max-h-32 overflow-y-auto">
                {(form.dokumen ?? []).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span className="truncate text-slate-800 dark:text-slate-200">{doc.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {formatFileSize(doc.size)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => downloadDataUrl(doc.dataUrl, doc.name)}
                        title="Unduh"
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-accent"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            'dokumen',
                            (form.dokumen ?? []).filter((d) => d.id !== doc.id)
                          )
                        }
                        title="Hapus"
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            Batal
          </button>
        )}
        {!isEditing && (
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg btn-accent-soft whitespace-nowrap shrink-0"
          >
            <Save className="w-4 h-4" />
            Simpan & Tambah Anggota Berikutnya
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg btn-accent whitespace-nowrap shrink-0"
        >
          <Save className="w-4 h-4" />
          {isEditing ? 'Simpan Perubahan' : 'Simpan Data Penduduk'}
        </button>
      </div>
    </form>
  );
}
