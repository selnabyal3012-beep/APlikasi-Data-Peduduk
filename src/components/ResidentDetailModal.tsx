import { Download, Edit3, FileText, Paperclip, X } from 'lucide-react';
import { Resident } from '../types/population';
import { DateFormatMode } from '../types/settings';
import { calculateAge, formatIndonesianDate } from '../lib/demographics';
import { downloadDataUrl, formatFileSize } from '../lib/fileHelpers';

interface ResidentDetailModalProps {
  resident: Resident | null;
  dateFormat?: DateFormatMode;
  onClose: () => void;
  onEdit: (resident: Resident) => void;
  onManageAttachments: (resident: Resident) => void;
}

export function ResidentDetailModal({
  resident,
  dateFormat = 'dd/mm/yyyy',
  onClose,
  onEdit,
  onManageAttachments,
}: ResidentDetailModalProps) {
  if (!resident) return null;
  const age = calculateAge(resident.tanggalLahir);
  const docs = resident.dokumen ?? [];

  const fields: { label: string; value: string; mono?: boolean }[] = [
    { label: 'NIK', value: resident.nik || '-', mono: true },
    { label: 'Nomor KK', value: resident.noKk || '-', mono: true },
    { label: 'Nama Lengkap', value: resident.namaLengkap },
    { label: 'Jenis Kelamin', value: resident.jenisKelamin },
    {
      label: 'Tempat, Tanggal Lahir',
      value: `${resident.tempatLahir || '-'}, ${formatIndonesianDate(
        resident.tanggalLahir,
        dateFormat
      )}${age !== null ? ` (${age} tahun)` : ''}`,
    },
    { label: 'Agama', value: resident.agama },
    { label: 'Pendidikan Terakhir', value: resident.pendidikan },
    { label: 'Pekerjaan', value: resident.pekerjaan || '-' },
    { label: 'Status Perkawinan', value: resident.statusPerkawinan },
    { label: 'Hubungan Keluarga', value: resident.hubunganKeluarga },
    { label: 'Kewarganegaraan', value: resident.kewarganegaraan },
    { label: 'Golongan Darah', value: resident.golonganDarah },
    { label: 'Nama Ayah', value: resident.namaAyah || '-' },
    { label: 'Nama Ibu', value: resident.namaIbu || '-' },
    {
      label: 'Wilayah (Dusun / RT / RW)',
      value: `${resident.dusun || '-'} · RT ${resident.rt || '-'} / RW ${resident.rw || '-'}`,
    },
    { label: 'Alamat Lengkap', value: resident.alamat || '-' },
    { label: 'Status Kependudukan', value: resident.statusKependudukan },
    { label: 'Keterangan', value: resident.keterangan || '-' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 no-print">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {resident.fotoUrl && (
              <img
                src={resident.fotoUrl}
                alt={`Foto ${resident.namaLengkap}`}
                className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            )}
            <div>
              <h2 id="detail-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Biodata Penduduk
              </h2>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                NIK {resident.nik || '-'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup biodata"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {fields.map((f) => (
              <div key={f.label} className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{f.label}</p>
                <p
                  className={`mt-0.5 text-sm text-slate-900 dark:text-slate-100 ${
                    f.mono ? 'font-mono tabular-nums' : ''
                  }`}
                >
                  {f.value}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Dokumen Terlampir ({docs.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onManageAttachments(resident);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                <Paperclip className="w-3.5 h-3.5" />
                Upload / Kelola Foto & Dokumen
              </button>
            </div>

            {docs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada dokumen pendukung.</p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {doc.name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                        ({formatFileSize(doc.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadDataUrl(doc.dataUrl, doc.name)}
                      className="inline-flex items-center gap-1 text-accent font-medium hover:underline shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(resident);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg btn-accent"
          >
            <Edit3 className="w-4 h-4" />
            Ubah Biodata
          </button>
        </div>
      </div>
    </div>
  );
}
