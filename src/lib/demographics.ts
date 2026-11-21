import { Resident } from '../types/population';

export interface FamilyGroup {
  noKk: string;
  kepalaKeluarga: string;
  dusun: string;
  rt: string;
  rw: string;
  alamat: string;
  members: Resident[];
}

export interface CountBucket {
  label: string;
  count: number;
  male: number;
  female: number;
}

export interface DemographicSummary {
  totalPenduduk: number;
  totalAktif: number;
  totalKk: number;
  lakiLaki: number;
  perempuan: number;
  wajibKtp: number; // >= 17 tahun atau sudah kawin
  ageGroups: CountBucket[];
  byDusun: CountBucket[];
  byEducation: CountBucket[];
  byOccupation: CountBucket[];
  byReligion: CountBucket[];
  byMaritalStatus: CountBucket[];
  byResidencyStatus: CountBucket[];
}

export function calculateAge(tanggalLahir: string): number | null {
  if (!tanggalLahir) return null;
  const dob = new Date(tanggalLahir);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

const MONTH_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatIndonesianDate(
  isoDate: string,
  format: 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'dd-mmm-yyyy' = 'dd/mm/yyyy'
): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  if (format === 'yyyy-mm-dd') return `${year}-${month}-${day}`;
  if (format === 'dd-mmm-yyyy') {
    const mIdx = Number(month) - 1;
    const mName = MONTH_SHORT_ID[mIdx] ?? month;
    return `${day} ${mName} ${year}`;
  }
  return `${day}/${month}/${year}`;
}

export function getAgeGroupLabel(age: number | null): string {
  if (age === null) return 'Tidak Diketahui';
  if (age <= 4) return 'Balita (0–4 th)';
  if (age <= 14) return 'Anak (5–14 th)';
  if (age <= 24) return 'Remaja / Pemuda (15–24 th)';
  if (age <= 59) return 'Produktif (25–59 th)';
  return 'Lansia (60+ th)';
}

export function groupFamilies(residents: Resident[]): FamilyGroup[] {
  const map = new Map<string, Resident[]>();

  for (const r of residents) {
    const key = r.noKk.trim() || `TANPA-KK-${r.id}`;
    const existing = map.get(key) ?? [];
    existing.push(r);
    map.set(key, existing);
  }

  const groups: FamilyGroup[] = [];
  for (const [key, members] of map.entries()) {
    const sortedMembers = [...members].sort((a, b) => {
      const rank = (role: string) => {
        if (role === 'Kepala Keluarga') return 0;
        if (role === 'Istri' || role === 'Suami') return 1;
        if (role === 'Anak') return 2;
        return 3;
      };
      const diff = rank(a.hubunganKeluarga) - rank(b.hubunganKeluarga);
      if (diff !== 0) return diff;
      return a.tanggalLahir.localeCompare(b.tanggalLahir);
    });

    const head =
      sortedMembers.find((m) => m.hubunganKeluarga === 'Kepala Keluarga') ?? sortedMembers[0];

    groups.push({
      noKk: key.startsWith('TANPA-KK-') ? 'Belum Ada No. KK' : key,
      kepalaKeluarga: head?.namaLengkap ?? '-',
      dusun: head?.dusun || '-',
      rt: head?.rt || '-',
      rw: head?.rw || '-',
      alamat: head?.alamat || '-',
      members: sortedMembers,
    });
  }

  return groups.sort((a, b) => a.noKk.localeCompare(b.noKk));
}

function buildBuckets(
  items: Resident[],
  getKey: (r: Resident) => string,
  orderedKeys?: string[]
): CountBucket[] {
  const map = new Map<string, CountBucket>();

  if (orderedKeys) {
    for (const k of orderedKeys) {
      map.set(k, { label: k, count: 0, male: 0, female: 0 });
    }
  }

  for (const r of items) {
    const label = getKey(r).trim() || 'Belum Diisi';
    const current = map.get(label) ?? { label, count: 0, male: 0, female: 0 };
    current.count += 1;
    if (r.jenisKelamin === 'Laki-laki') current.male += 1;
    else current.female += 1;
    map.set(label, current);
  }

  const values = Array.from(map.values());
  if (orderedKeys) {
    return values.filter((v) => v.count > 0 || orderedKeys.includes(v.label));
  }
  return values.sort((a, b) => b.count - a.count);
}

export function computeDemographics(residents: Resident[]): DemographicSummary {
  const activeResidents = residents.filter(
    (r) => r.statusKependudukan !== 'Pindah' && r.statusKependudukan !== 'Meninggal'
  );

  const uniqueKk = new Set(
    activeResidents.map((r) => r.noKk.trim()).filter((kk) => kk.length > 0)
  );

  let lakiLaki = 0;
  let perempuan = 0;
  let wajibKtp = 0;

  for (const r of activeResidents) {
    if (r.jenisKelamin === 'Laki-laki') lakiLaki += 1;
    else perempuan += 1;

    const age = calculateAge(r.tanggalLahir);
    if ((age !== null && age >= 17) || r.statusPerkawinan !== 'Belum Kawin') {
      wajibKtp += 1;
    }
  }

  const orderedAgeKeys = [
    'Balita (0–4 th)',
    'Anak (5–14 th)',
    'Remaja / Pemuda (15–24 th)',
    'Produktif (25–59 th)',
    'Lansia (60+ th)',
    'Tidak Diketahui',
  ];

  return {
    totalPenduduk: residents.length,
    totalAktif: activeResidents.length,
    totalKk: uniqueKk.size,
    lakiLaki,
    perempuan,
    wajibKtp,
    ageGroups: buildBuckets(
      activeResidents,
      (r) => getAgeGroupLabel(calculateAge(r.tanggalLahir)),
      orderedAgeKeys
    ).filter((b) => b.label !== 'Tidak Diketahui' || b.count > 0),
    byDusun: buildBuckets(activeResidents, (r) => r.dusun || 'Belum Ditentukan'),
    byEducation: buildBuckets(activeResidents, (r) => r.pendidikan),
    byOccupation: buildBuckets(activeResidents, (r) => r.pekerjaan || 'Belum Diisi'),
    byReligion: buildBuckets(activeResidents, (r) => r.agama),
    byMaritalStatus: buildBuckets(activeResidents, (r) => r.statusPerkawinan),
    byResidencyStatus: buildBuckets(residents, (r) => r.statusKependudukan),
  };
}
