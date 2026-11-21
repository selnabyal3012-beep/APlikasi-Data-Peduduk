import { PrintMode, Resident, VillageProfile } from '../types/population';
import { DateFormatMode } from '../types/settings';
import {
  CountBucket,
  calculateAge,
  computeDemographics,
  formatIndonesianDate,
  groupFamilies,
} from '../lib/demographics';

export interface PrintOptions {
  blankRows?: number;
  selectedKk?: string;
  selectedResidentId?: string;
  subtitleNote?: string;
  showLogo?: boolean;
  showSignature?: boolean;
  dateFormat?: DateFormatMode;
  columnMode?: 'standar' | 'lengkap';
  includeDemografi?: boolean;
}

interface PrintViewsProps {
  mode: PrintMode;
  residents: Resident[];
  profile: VillageProfile;
  options?: PrintOptions;
  previewOnly?: boolean;
}

function PrintHeader({
  title,
  profile,
  subtitleNote,
  showLogo = true,
}: {
  title: string;
  profile: VillageProfile;
  subtitleNote?: string;
  showLogo?: boolean;
}) {
  const lokasi = [
    profile.namaDesa ? `DESA ${profile.namaDesa.toUpperCase()}` : 'DESA ________________________',
    profile.kecamatan ? `KEC. ${profile.kecamatan.toUpperCase()}` : 'KEC. ______________',
    profile.kabupaten ? `KAB. ${profile.kabupaten.toUpperCase()}` : 'KAB. ______________',
  ].join(' · ');

  return (
    <div className="mb-4 pb-2 border-b-2 border-black">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {showLogo && profile.logoUrl && (
            <img
              src={profile.logoUrl}
              alt="Logo Desa"
              className="w-11 h-11 object-contain shrink-0"
            />
          )}
          <div>
            <h1 className="text-base font-bold uppercase tracking-wide">{title}</h1>
            <p className="text-xs font-semibold mt-0.5">{lokasi}</p>
            {subtitleNote && <p className="text-[11px] text-slate-700 mt-0.5">{subtitleNote}</p>}
          </div>
        </div>
        <div className="text-right text-xs">
          <p>Tahun Buku: {profile.tahunBuku || '______'}</p>
          {profile.kodeDesa && <p>Kode Desa: {profile.kodeDesa}</p>}
          <p className="text-[10px] text-slate-700">
            Dicetak: {new Date().toLocaleDateString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}

function PrintSignature({
  profile,
  showSignature = true,
}: {
  profile: VillageProfile;
  showSignature?: boolean;
}) {
  if (!showSignature) return null;
  return (
    <div className="mt-8 grid grid-cols-2 text-xs print-section-avoid">
      <div className="text-center">
        <p>Mengetahui,</p>
        <p className="font-semibold">Kepala Desa {profile.namaDesa || '______________'}</p>
        <div className="h-16" />
        <p className="font-semibold underline">
          {profile.kepalaDesa || '( .................................... )'}
        </p>
      </div>
      <div className="text-center">
        <p>
          {profile.namaDesa || '______________'}, {new Date().toLocaleDateString('id-ID')}
        </p>
        <p className="font-semibold">Sekretaris Desa / Petugas Pendata</p>
        <div className="h-16" />
        <p className="font-semibold underline">
          {profile.sekretarisDesa || '( .................................... )'}
        </p>
      </div>
    </div>
  );
}

function DemographicPrintTable({
  title,
  buckets,
  totalBase,
}: {
  title: string;
  buckets: CountBucket[];
  totalBase: number;
}) {
  return (
    <div className="print-section-avoid">
      <h3 className="font-bold text-[11px] mb-1 uppercase tracking-wide">{title}</h3>
      <table className="print-table w-full border-collapse text-[10px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-black px-2 py-1 text-left">Kategori</th>
            <th className="border border-black px-2 py-1 text-right w-10">L</th>
            <th className="border border-black px-2 py-1 text-right w-10">P</th>
            <th className="border border-black px-2 py-1 text-right w-12">Total</th>
            <th className="border border-black px-2 py-1 text-right w-12">%</th>
          </tr>
        </thead>
        <tbody>
          {buckets.length === 0 ? (
            <tr>
              <td colSpan={5} className="border border-black px-2 py-2 text-center">
                Tidak ada data.
              </td>
            </tr>
          ) : (
            buckets.map((b) => {
              const pct = totalBase > 0 ? ((b.count / totalBase) * 100).toFixed(1) : '0.0';
              return (
                <tr key={b.label}>
                  <td className="border border-black px-2 py-1">{b.label}</td>
                  <td className="border border-black px-2 py-1 text-right font-mono tabular-nums">
                    {b.male}
                  </td>
                  <td className="border border-black px-2 py-1 text-right font-mono tabular-nums">
                    {b.female}
                  </td>
                  <td className="border border-black px-2 py-1 text-right font-mono font-bold tabular-nums">
                    {b.count}
                  </td>
                  <td className="border border-black px-2 py-1 text-right font-mono tabular-nums">
                    {pct}%
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function FullResidentsPrintTable({
  residents,
  dateFormat,
  columnMode = 'standar',
}: {
  residents: Resident[];
  dateFormat: DateFormatMode;
  columnMode?: 'standar' | 'lengkap';
}) {
  if (columnMode === 'lengkap') {
    return (
      <table className="print-table w-full border-collapse text-[8.5px] leading-tight">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-black px-1 py-1.5 text-center w-6">No</th>
            <th className="border border-black px-1 py-1.5 text-left">No. KK</th>
            <th className="border border-black px-1 py-1.5 text-left">NIK</th>
            <th className="border border-black px-1 py-1.5 text-left">Nama Lengkap</th>
            <th className="border border-black px-1 py-1.5 text-center w-6">L/P</th>
            <th className="border border-black px-1 py-1.5 text-left">Tempat Lahir</th>
            <th className="border border-black px-1 py-1.5 text-left">Tgl Lahir</th>
            <th className="border border-black px-1 py-1.5 text-center w-8">Umur</th>
            <th className="border border-black px-1 py-1.5 text-left">Agama</th>
            <th className="border border-black px-1 py-1.5 text-left">Pendidikan</th>
            <th className="border border-black px-1 py-1.5 text-left">Pekerjaan</th>
            <th className="border border-black px-1 py-1.5 text-left">Status Kawin</th>
            <th className="border border-black px-1 py-1.5 text-left">SHDK</th>
            <th className="border border-black px-1 py-1.5 text-center w-8">Darah</th>
            <th className="border border-black px-1 py-1.5 text-center w-8">WN</th>
            <th className="border border-black px-1 py-1.5 text-left">Orang Tua (Ayah / Ibu)</th>
            <th className="border border-black px-1 py-1.5 text-left">Alamat / Dusun / RT-RW</th>
            <th className="border border-black px-1 py-1.5 text-left">Status & Ket</th>
          </tr>
        </thead>
        <tbody>
          {residents.length === 0 ? (
            <tr>
              <td colSpan={18} className="border border-black px-2 py-6 text-center">
                Belum ada data penduduk sesuai kriteria cetak.
              </td>
            </tr>
          ) : (
            residents.map((r, idx) => {
              const age = calculateAge(r.tanggalLahir);
              return (
                <tr key={r.id}>
                  <td className="border border-black px-1 py-1 text-center font-mono tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="border border-black px-1 py-1 font-mono tabular-nums">{r.noKk || '-'}</td>
                  <td className="border border-black px-1 py-1 font-mono tabular-nums">{r.nik || '-'}</td>
                  <td className="border border-black px-1 py-1 font-semibold">{r.namaLengkap}</td>
                  <td className="border border-black px-1 py-1 text-center">
                    {r.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                  </td>
                  <td className="border border-black px-1 py-1">{r.tempatLahir || '-'}</td>
                  <td className="border border-black px-1 py-1 font-mono tabular-nums whitespace-nowrap">
                    {formatIndonesianDate(r.tanggalLahir, dateFormat)}
                  </td>
                  <td className="border border-black px-1 py-1 text-center font-mono tabular-nums">
                    {age !== null ? age : '-'}
                  </td>
                  <td className="border border-black px-1 py-1">{r.agama}</td>
                  <td className="border border-black px-1 py-1">{r.pendidikan}</td>
                  <td className="border border-black px-1 py-1">{r.pekerjaan || '-'}</td>
                  <td className="border border-black px-1 py-1">{r.statusPerkawinan}</td>
                  <td className="border border-black px-1 py-1">{r.hubunganKeluarga}</td>
                  <td className="border border-black px-1 py-1 text-center">
                    {r.golonganDarah === 'Tidak Tahu' ? '-' : r.golonganDarah}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">{r.kewarganegaraan}</td>
                  <td className="border border-black px-1 py-1">
                    {r.namaAyah || '-'} / {r.namaIbu || '-'}
                  </td>
                  <td className="border border-black px-1 py-1">
                    {[r.alamat, r.dusun, r.rt || r.rw ? `RT ${r.rt || '00'}/RW ${r.rw || '00'}` : '']
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </td>
                  <td className="border border-black px-1 py-1">
                    {r.statusKependudukan}
                    {r.keterangan ? ` (${r.keterangan})` : ''}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  }

  return (
    <table className="print-table w-full border-collapse text-[10px]">
      <thead>
        <tr className="bg-slate-100">
          <th className="border border-black px-1 py-1.5 text-center w-8">No</th>
          <th className="border border-black px-1 py-1.5 text-left">No. KK</th>
          <th className="border border-black px-1 py-1.5 text-left">NIK</th>
          <th className="border border-black px-1 py-1.5 text-left">Nama Lengkap</th>
          <th className="border border-black px-1 py-1.5 text-center w-8">L/P</th>
          <th className="border border-black px-1 py-1.5 text-left">Tempat Lahir</th>
          <th className="border border-black px-1 py-1.5 text-left">Tgl Lahir</th>
          <th className="border border-black px-1 py-1.5 text-left">Agama</th>
          <th className="border border-black px-1 py-1.5 text-left">Pendidikan</th>
          <th className="border border-black px-1 py-1.5 text-left">Pekerjaan</th>
          <th className="border border-black px-1 py-1.5 text-left">SHDK</th>
          <th className="border border-black px-1 py-1.5 text-left">Dusun / RT / RW</th>
          <th className="border border-black px-1 py-1.5 text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        {residents.length === 0 ? (
          <tr>
            <td colSpan={13} className="border border-black px-2 py-6 text-center">
              Belum ada data penduduk sesuai kriteria cetak.
            </td>
          </tr>
        ) : (
          residents.map((r, idx) => (
            <tr key={r.id}>
              <td className="border border-black px-1 py-1 text-center font-mono tabular-nums">
                {idx + 1}
              </td>
              <td className="border border-black px-1 py-1 font-mono tabular-nums">{r.noKk || '-'}</td>
              <td className="border border-black px-1 py-1 font-mono tabular-nums">{r.nik || '-'}</td>
              <td className="border border-black px-1 py-1 font-medium">{r.namaLengkap}</td>
              <td className="border border-black px-1 py-1 text-center">
                {r.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
              </td>
              <td className="border border-black px-1 py-1">{r.tempatLahir || '-'}</td>
              <td className="border border-black px-1 py-1 font-mono tabular-nums whitespace-nowrap">
                {formatIndonesianDate(r.tanggalLahir, dateFormat)}
              </td>
              <td className="border border-black px-1 py-1">{r.agama}</td>
              <td className="border border-black px-1 py-1">{r.pendidikan}</td>
              <td className="border border-black px-1 py-1">{r.pekerjaan || '-'}</td>
              <td className="border border-black px-1 py-1">{r.hubunganKeluarga}</td>
              <td className="border border-black px-1 py-1">
                {r.dusun || '-'} RT {r.rt || '00'}/{r.rw || '00'}
              </td>
              <td className="border border-black px-1 py-1">{r.statusKependudukan}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export function PrintSheetContent({
  mode,
  residents,
  profile,
  options,
}: {
  mode: Exclude<PrintMode, 'none'>;
  residents: Resident[];
  profile: VillageProfile;
  options?: PrintOptions;
}) {
  const showLogo = options?.showLogo ?? true;
  const showSignature = options?.showSignature ?? true;
  const dateFormat = options?.dateFormat ?? 'dd/mm/yyyy';
  const columnMode = options?.columnMode ?? 'standar';

  if (mode === 'rekap-semua') {
    const stats = computeDemographics(residents);
    const totalMaleAll = residents.filter((r) => r.jenisKelamin === 'Laki-laki').length;
    const totalFemaleAll = residents.length - totalMaleAll;
    const totalKkAll = new Set(residents.map((r) => r.noKk.trim()).filter(Boolean)).size;
    const includeDemografi = options?.includeDemografi ?? true;

    return (
      <div className="text-black space-y-5">
        <PrintHeader
          title="REKAPAN LENGKAP SEMUA DATA PENDUDUK DESA"
          profile={profile}
          subtitleNote={
            options?.subtitleNote
              ? `${options.subtitleNote} · Total Data Tercetak: ${residents.length} Jiwa`
              : `Total Data Tercetak: ${residents.length} Jiwa (${totalKkAll} KK)`
          }
          showLogo={showLogo}
        />

        {/* Ringkasan Eksekutif */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px] border border-black p-2 bg-slate-50 print-section-avoid">
          <div>
            Total Tercatat: <strong className="font-mono">{residents.length}</strong>
          </div>
          <div>
            Penduduk Aktif: <strong className="font-mono">{stats.totalAktif}</strong>
          </div>
          <div>
            Jumlah KK: <strong className="font-mono">{totalKkAll}</strong>
          </div>
          <div>
            Laki-laki: <strong className="font-mono">{totalMaleAll}</strong>
          </div>
          <div>
            Perempuan: <strong className="font-mono">{totalFemaleAll}</strong>
          </div>
          <div>
            Wajib KTP: <strong className="font-mono">{stats.wajibKtp}</strong>
          </div>
        </div>

        {/* Tabel Lengkap Semua Data Penduduk (Tanpa Batas Baris/Halaman) */}
        <div>
          <h2 className="font-bold text-xs uppercase tracking-wide mb-1.5">
            I. Daftar Lengkap Data Penduduk ({residents.length} Baris)
          </h2>
          <FullResidentsPrintTable
            residents={residents}
            dateFormat={dateFormat}
            columnMode={columnMode}
          />
        </div>

        {/* Rekapitulasi Demografi 7 Kategori */}
        {includeDemografi && (
          <div className="space-y-4 pt-2">
            <h2 className="font-bold text-xs uppercase tracking-wide border-b border-black pb-1">
              II. Rekapitulasi Statistik & Demografi Penduduk
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <DemographicPrintTable
                title="Sebaran per Dusun / Wilayah (Aktif)"
                buckets={stats.byDusun}
                totalBase={stats.totalAktif}
              />
              <DemographicPrintTable
                title="Kelompok Umur (Aktif)"
                buckets={stats.ageGroups}
                totalBase={stats.totalAktif}
              />
              <DemographicPrintTable
                title="Tingkat Pendidikan (Aktif)"
                buckets={stats.byEducation}
                totalBase={stats.totalAktif}
              />
              <DemographicPrintTable
                title="Mata Pencaharian / Pekerjaan (Aktif)"
                buckets={stats.byOccupation}
                totalBase={stats.totalAktif}
              />
              <DemographicPrintTable
                title="Agama (Aktif)"
                buckets={stats.byReligion}
                totalBase={stats.totalAktif}
              />
              <DemographicPrintTable
                title="Status Perkawinan (Aktif)"
                buckets={stats.byMaritalStatus}
                totalBase={stats.totalAktif}
              />
              <DemographicPrintTable
                title="Status Kependudukan (Semua Data)"
                buckets={stats.byResidencyStatus}
                totalBase={stats.totalPenduduk}
              />
            </div>
          </div>
        )}

        <PrintSignature profile={profile} showSignature={showSignature} />
      </div>
    );
  }

  if (mode === 'blank-template') {
    const count = options?.blankRows ?? 15;
    const emptyRows = Array.from({ length: count }, (_, idx) => idx + 1);
    return (
      <div className="text-black">
        <PrintHeader
          title="FORMULIR KOSONG PENDATAAN PENDUDUK DESA (BUKU INDUK)"
          profile={profile}
          subtitleNote={options?.subtitleNote}
          showLogo={showLogo}
        />
        <p className="text-[10px] mb-2">
          Dusun: ______________________ &nbsp;&nbsp; RT / RW: _____ / _____ &nbsp;&nbsp; Tanggal
          Pendataan: ____ / ____ / 20____
        </p>
        <table className="print-table w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black px-1.5 py-2 w-7">No</th>
              <th className="border border-black px-1.5 py-2 w-28">No. KK (16 digit)</th>
              <th className="border border-black px-1.5 py-2 w-28">NIK (16 digit)</th>
              <th className="border border-black px-1.5 py-2">Nama Lengkap</th>
              <th className="border border-black px-1.5 py-2 w-8">L/P</th>
              <th className="border border-black px-1.5 py-2 w-28">Tempat & Tgl Lahir</th>
              <th className="border border-black px-1.5 py-2 w-16">Agama</th>
              <th className="border border-black px-1.5 py-2 w-20">Pendidikan</th>
              <th className="border border-black px-1.5 py-2 w-24">Pekerjaan</th>
              <th className="border border-black px-1.5 py-2 w-20">Status Kawin</th>
              <th className="border border-black px-1.5 py-2 w-20">SHDK</th>
              <th className="border border-black px-1.5 py-2 w-20">Ket</th>
            </tr>
          </thead>
          <tbody>
            {emptyRows.map((num) => (
              <tr key={num}>
                <td className="border border-black px-1.5 py-3 text-center font-mono">{num}</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
                <td className="border border-black px-1.5 py-3">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
        <PrintSignature profile={profile} showSignature={showSignature} />
      </div>
    );
  }

  if (mode === 'buku-induk') {
    return (
      <div className="text-black">
        <PrintHeader
          title="BUKU INDUK PENDUDUK DESA"
          profile={profile}
          subtitleNote={
            options?.subtitleNote
              ? `${options.subtitleNote} · Total Data: ${residents.length} Jiwa`
              : `Total Data: ${residents.length} Jiwa`
          }
          showLogo={showLogo}
        />
        <FullResidentsPrintTable
          residents={residents}
          dateFormat={dateFormat}
          columnMode={columnMode}
        />
        <PrintSignature profile={profile} showSignature={showSignature} />
      </div>
    );
  }

  if (mode === 'kartu-keluarga') {
    const allFamilies = groupFamilies(residents);
    const families =
      options?.selectedKk && options.selectedKk !== 'all'
        ? allFamilies.filter((f) => f.noKk === options.selectedKk)
        : allFamilies;

    return (
      <div className="text-black space-y-6">
        <PrintHeader
          title="REKAPITULASI DATA KARTU KELUARGA (KK)"
          profile={profile}
          subtitleNote={options?.subtitleNote}
          showLogo={showLogo}
        />
        {families.length === 0 ? (
          <p className="text-xs text-center py-6 border border-black">
            Tidak ada data Kartu Keluarga untuk dicetak.
          </p>
        ) : (
          families.map((fam) => (
            <div key={fam.noKk} className="space-y-1.5 print-section-avoid">
              <div className="flex flex-wrap items-baseline justify-between text-xs border border-black bg-slate-100 px-2.5 py-1.5">
                <div>
                  <strong>No. KK:</strong> <span className="font-mono">{fam.noKk}</span> &nbsp;·&nbsp;{' '}
                  <strong>Kepala Keluarga:</strong> {fam.kepalaKeluarga}
                </div>
                <div>
                  {fam.dusun} · RT {fam.rt} / RW {fam.rw} · {fam.alamat}
                </div>
              </div>
              <table className="print-table w-full border-collapse text-[10px]">
                <thead>
                  <tr>
                    <th className="border border-black px-1.5 py-1 w-7">No</th>
                    <th className="border border-black px-1.5 py-1">NIK</th>
                    <th className="border border-black px-1.5 py-1">Nama Lengkap</th>
                    <th className="border border-black px-1.5 py-1">L/P</th>
                    <th className="border border-black px-1.5 py-1">Tempat, Tgl Lahir</th>
                    <th className="border border-black px-1.5 py-1">Agama</th>
                    <th className="border border-black px-1.5 py-1">Pendidikan</th>
                    <th className="border border-black px-1.5 py-1">Pekerjaan</th>
                    <th className="border border-black px-1.5 py-1">SHDK</th>
                    <th className="border border-black px-1.5 py-1">Status Kawin</th>
                  </tr>
                </thead>
                <tbody>
                  {fam.members.map((m, idx) => (
                    <tr key={m.id}>
                      <td className="border border-black px-1.5 py-1 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="border border-black px-1.5 py-1 font-mono">{m.nik}</td>
                      <td className="border border-black px-1.5 py-1 font-medium">
                        {m.namaLengkap}
                      </td>
                      <td className="border border-black px-1.5 py-1 text-center">
                        {m.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                      </td>
                      <td className="border border-black px-1.5 py-1">
                        {m.tempatLahir}, {formatIndonesianDate(m.tanggalLahir, dateFormat)}
                      </td>
                      <td className="border border-black px-1.5 py-1">{m.agama}</td>
                      <td className="border border-black px-1.5 py-1">{m.pendidikan}</td>
                      <td className="border border-black px-1.5 py-1">{m.pekerjaan}</td>
                      <td className="border border-black px-1.5 py-1">{m.hubunganKeluarga}</td>
                      <td className="border border-black px-1.5 py-1">{m.statusPerkawinan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
        <PrintSignature profile={profile} showSignature={showSignature} />
      </div>
    );
  }

  if (mode === 'biodata-individu') {
    const person =
      residents.find((r) => r.id === options?.selectedResidentId) ?? residents[0] ?? null;

    if (!person) {
      return (
        <div className="text-black">
          <PrintHeader title="BIODATA PENDUDUK DESA" profile={profile} showLogo={showLogo} />
          <p className="text-xs text-center py-6 border border-black">
            Belum ada data penduduk yang dipilih untuk dicetak.
          </p>
        </div>
      );
    }

    const age = calculateAge(person.tanggalLahir);
    const rows: [string, string][] = [
      ['Nomor Kartu Keluarga (No. KK)', person.noKk || '-'],
      ['Nomor Induk Kependudukan (NIK)', person.nik || '-'],
      ['Nama Lengkap', person.namaLengkap],
      ['Jenis Kelamin', person.jenisKelamin],
      [
        'Tempat / Tanggal Lahir',
        `${person.tempatLahir || '-'}, ${formatIndonesianDate(person.tanggalLahir, dateFormat)}${
          age !== null ? ` (${age} Tahun)` : ''
        }`,
      ],
      ['Agama', person.agama],
      ['Pendidikan Terakhir', person.pendidikan],
      ['Pekerjaan', person.pekerjaan || '-'],
      ['Status Perkawinan', person.statusPerkawinan],
      ['Status Hubungan dalam Keluarga', person.hubunganKeluarga],
      ['Kewarganegaraan', person.kewarganegaraan],
      ['Golongan Darah', person.golonganDarah],
      ['Nama Ayah', person.namaAyah || '-'],
      ['Nama Ibu', person.namaIbu || '-'],
      [
        'Alamat & Wilayah',
        `${person.alamat || '-'} · ${person.dusun || '-'} RT ${person.rt || '-'} / RW ${
          person.rw || '-'
        }`,
      ],
      ['Status Kependudukan', person.statusKependudukan],
      ['Keterangan', person.keterangan || '-'],
    ];

    return (
      <div className="text-black">
        <PrintHeader title="SURAT BIODATA PENDUDUK DESA" profile={profile} showLogo={showLogo} />
        <div className="flex items-start gap-6">
          <table className="print-table flex-1 border-collapse text-xs">
            <tbody>
              {rows.map(([label, val]) => (
                <tr key={label}>
                  <td className="border border-black px-3 py-1.5 font-semibold w-56 bg-slate-50">
                    {label}
                  </td>
                  <td className="border border-black px-3 py-1.5">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="w-28 h-36 border border-black flex items-center justify-center text-[10px] text-slate-500 shrink-0 overflow-hidden">
            {person.fotoUrl ? (
              <img
                src={person.fotoUrl}
                alt={`Foto ${person.namaLengkap}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>Pas Foto 3x4</span>
            )}
          </div>
        </div>
        <PrintSignature profile={profile} showSignature={showSignature} />
      </div>
    );
  }

  // statistik (Semua 7 Tabel Kategori Demografi)
  const stats = computeDemographics(residents);
  return (
    <div className="text-black space-y-4">
      <PrintHeader
        title="LAPORAN REKAPITULASI DEMOGRAFI PENDUDUK DESA"
        profile={profile}
        subtitleNote={options?.subtitleNote}
        showLogo={showLogo}
      />
      <div className="grid grid-cols-5 gap-2 text-xs border border-black p-2 bg-slate-50 print-section-avoid">
        <div>
          Penduduk Aktif: <strong className="font-mono">{stats.totalAktif}</strong>
        </div>
        <div>
          Jumlah KK: <strong className="font-mono">{stats.totalKk}</strong>
        </div>
        <div>
          Laki-laki: <strong className="font-mono">{stats.lakiLaki}</strong>
        </div>
        <div>
          Perempuan: <strong className="font-mono">{stats.perempuan}</strong>
        </div>
        <div>
          Wajib KTP: <strong className="font-mono">{stats.wajibKtp}</strong>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DemographicPrintTable
          title="Sebaran per Dusun"
          buckets={stats.byDusun}
          totalBase={stats.totalAktif}
        />
        <DemographicPrintTable
          title="Kelompok Umur"
          buckets={stats.ageGroups}
          totalBase={stats.totalAktif}
        />
        <DemographicPrintTable
          title="Tingkat Pendidikan"
          buckets={stats.byEducation}
          totalBase={stats.totalAktif}
        />
        <DemographicPrintTable
          title="Pekerjaan / Mata Pencaharian"
          buckets={stats.byOccupation}
          totalBase={stats.totalAktif}
        />
        <DemographicPrintTable
          title="Agama"
          buckets={stats.byReligion}
          totalBase={stats.totalAktif}
        />
        <DemographicPrintTable
          title="Status Perkawinan"
          buckets={stats.byMaritalStatus}
          totalBase={stats.totalAktif}
        />
        <DemographicPrintTable
          title="Status Kependudukan (Semua Data)"
          buckets={stats.byResidencyStatus}
          totalBase={stats.totalPenduduk}
        />
      </div>
      <PrintSignature profile={profile} showSignature={showSignature} />
    </div>
  );
}

export function PrintViews({ mode, residents, profile, options }: PrintViewsProps) {
  if (mode === 'none') return null;
  return (
    <div className="print-only">
      <PrintSheetContent mode={mode} residents={residents} profile={profile} options={options} />
    </div>
  );
}
