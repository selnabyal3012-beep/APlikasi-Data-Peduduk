import { ChangeEvent, useState } from 'react';
import { Download, FileText, ImagePlus, Paperclip, Trash2, Upload, X } from 'lucide-react';
import { Resident, ResidentDocument } from '../types/population';
import {
  compressImageToDataUrl,
  downloadDataUrl,
  formatFileSize,
  readFileAsDataUrl,
} from '../lib/fileHelpers';

interface ResidentAttachmentsModalProps {
  resident: Resident | null;
  onClose: () => void;
  onUpdateAttachments: (
    residentId: string,
    fotoUrl: string | undefined,
    dokumen: ResidentDocument[]
  ) => void;
}

const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB

export function ResidentAttachmentsModal({
  resident,
  onClose,
  onUpdateAttachments,
}: ResidentAttachmentsModalProps) {
  const [error, setError] = useState('');

  if (!resident) return null;

  const docs = resident.dokumen ?? [];

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    if (!resident) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Foto penduduk harus berupa berkas gambar (JPG, PNG, WebP).');
      e.target.value = '';
      return;
    }

    try {
      const compressed = await compressImageToDataUrl(file, 640, 0.85);
      onUpdateAttachments(resident.id, compressed, docs);
    } catch {
      setError('Gagal memproses foto penduduk.');
    }
    e.target.value = '';
  }

  async function handleDocsUpload(e: ChangeEvent<HTMLInputElement>) {
    if (!resident) return;
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError('');

    const added: ResidentDocument[] = [];
    for (const file of files) {
      if (file.size > MAX_DOC_BYTES) {
        setError(`Berkas "${file.name}" melebihi batas 5 MB.`);
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
        setError(`Gagal membaca berkas "${file.name}".`);
      }
    }

    if (added.length > 0) {
      onUpdateAttachments(resident.id, resident.fotoUrl, [...docs, ...added]);
    }
    e.target.value = '';
  }

  function handleRemovePhoto() {
    if (!resident) return;
    onUpdateAttachments(resident.id, undefined, docs);
  }

  function handleRemoveDoc(docId: string) {
    if (!resident) return;
    onUpdateAttachments(
      resident.id,
      resident.fotoUrl,
      docs.filter((d) => d.id !== docId)
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 no-print">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attach-modal-title"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="attach-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Foto & Dokumen Penduduk — {resident.namaLengkap}
            </h2>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              NIK {resident.nik || '-'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kelola foto dan dokumen"
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="px-3.5 py-2.5 text-xs text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-lg">
              {error}
            </div>
          )}

          {/* Foto Penduduk */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              01. Pas Foto / Foto Penduduk
            </h3>
            <div className="flex flex-wrap items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/70 dark:bg-slate-800/50">
              <div className="w-24 h-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                {resident.fotoUrl ? (
                  <img
                    src={resident.fotoUrl}
                    alt={`Foto ${resident.namaLengkap}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImagePlus className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Unggah foto wajah/KTP penduduk (JPG/PNG). Disimpan otomatis secara offline.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg btn-accent cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {resident.fotoUrl ? 'Ganti Foto' : 'Upload Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="sr-only"
                    />
                  </label>
                  {resident.fotoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dokumen Pendukung */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  02. Dokumen Pendukung (KK, KTP, Akta, Ijazah)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dapat mengunggah beberapa berkas gambar atau PDF (maks. 5 MB per berkas).
                </p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg btn-accent-soft cursor-pointer whitespace-nowrap">
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

            {docs.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada dokumen yang diunggah untuk penduduk ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          {formatFileSize(doc.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => downloadDataUrl(doc.dataUrl, doc.name)}
                        title="Unduh Dokumen"
                        className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-accent rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        title="Hapus Dokumen"
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg btn-accent"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
