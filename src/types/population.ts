export type Gender = 'Laki-laki' | 'Perempuan';

export type Religion =
  | 'Islam'
  | 'Kristen'
  | 'Katolik'
  | 'Hindu'
  | 'Buddha'
  | 'Konghucu'
  | 'Kepercayaan';

export type MaritalStatus =
  | 'Belum Kawin'
  | 'Kawin'
  | 'Cerai Hidup'
  | 'Cerai Mati';

export type FamilyRole =
  | 'Kepala Keluarga'
  | 'Suami'
  | 'Istri'
  | 'Anak'
  | 'Menantu'
  | 'Cucu'
  | 'Orang Tua'
  | 'Mertua'
  | 'Famili Lain'
  | 'Pembantu'
  | 'Lainnya';

export type EducationLevel =
  | 'Tidak/Belum Sekolah'
  | 'Belum Tamat SD/Sederajat'
  | 'Tamat SD/Sederajat'
  | 'SLTP/Sederajat'
  | 'SLTA/Sederajat'
  | 'Diploma I/II'
  | 'Akademi/Diploma III/S. Muda'
  | 'Diploma IV/Strata I'
  | 'Strata II'
  | 'Strata III';

export type BloodType = 'A' | 'B' | 'AB' | 'O' | 'Tidak Tahu';

export type ResidencyStatus =
  | 'Tetap'
  | 'Pendatang'
  | 'Sementara'
  | 'Pindah'
  | 'Meninggal';

export type Citizenship = 'WNI' | 'WNA';

export interface ResidentDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface Resident {
  id: string;
  noKk: string;
  nik: string;
  namaLengkap: string;
  jenisKelamin: Gender;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  agama: Religion;
  pendidikan: EducationLevel;
  pekerjaan: string;
  statusPerkawinan: MaritalStatus;
  hubunganKeluarga: FamilyRole;
  kewarganegaraan: Citizenship;
  golonganDarah: BloodType;
  namaAyah: string;
  namaIbu: string;
  dusun: string;
  rt: string;
  rw: string;
  alamat: string;
  statusKependudukan: ResidencyStatus;
  keterangan: string;
  fotoUrl?: string;
  dokumen?: ResidentDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface VillageProfile {
  namaDesa: string;
  kodeDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kepalaDesa: string;
  sekretarisDesa: string;
  tahunBuku: string;
  daftarDusun: string[];
  logoUrl?: string;
}

export type AppView =
  | 'dashboard'
  | 'buku-induk'
  | 'input-manual'
  | 'kartu-keluarga'
  | 'statistik'
  | 'print-data'
  | 'template-data'
  | 'profil-desa'
  | 'pengaturan';

export type PrintMode =
  | 'none'
  | 'rekap-semua'
  | 'blank-template'
  | 'buku-induk'
  | 'statistik'
  | 'kartu-keluarga'
  | 'biodata-individu';

export const GENDER_OPTIONS: Gender[] = ['Laki-laki', 'Perempuan'];

export const RELIGION_OPTIONS: Religion[] = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
  'Kepercayaan',
];

export const MARITAL_STATUS_OPTIONS: MaritalStatus[] = [
  'Belum Kawin',
  'Kawin',
  'Cerai Hidup',
  'Cerai Mati',
];

export const FAMILY_ROLE_OPTIONS: FamilyRole[] = [
  'Kepala Keluarga',
  'Suami',
  'Istri',
  'Anak',
  'Menantu',
  'Cucu',
  'Orang Tua',
  'Mertua',
  'Famili Lain',
  'Pembantu',
  'Lainnya',
];

export const EDUCATION_OPTIONS: EducationLevel[] = [
  'Tidak/Belum Sekolah',
  'Belum Tamat SD/Sederajat',
  'Tamat SD/Sederajat',
  'SLTP/Sederajat',
  'SLTA/Sederajat',
  'Diploma I/II',
  'Akademi/Diploma III/S. Muda',
  'Diploma IV/Strata I',
  'Strata II',
  'Strata III',
];

export const COMMON_OCCUPATIONS: string[] = [
  'Belum/Tidak Bekerja',
  'Mengurus Rumah Tangga',
  'Pelajar/Mahasiswa',
  'Pensiunan',
  'Petani/Pekebun',
  'Peternak',
  'Nelayan/Perikanan',
  'Buruh Tani/Perkebunan',
  'Buruh Harian Lepas',
  'Wiraswasta',
  'Pedagang',
  'Karyawan Swasta',
  'Pegawai Negeri Sipil (PNS)',
  'TNI/Polri',
  'Perangkat Desa',
  'Guru/Dosen',
  'Bidan/Perawat/Tenaga Kesehatan',
  'Tukang/Pengrajin',
  'Sopir/Transportasi',
  'Lainnya',
];

export const BLOOD_TYPE_OPTIONS: BloodType[] = ['A', 'B', 'AB', 'O', 'Tidak Tahu'];

export const RESIDENCY_STATUS_OPTIONS: ResidencyStatus[] = [
  'Tetap',
  'Pendatang',
  'Sementara',
  'Pindah',
  'Meninggal',
];

export const CITIZENSHIP_OPTIONS: Citizenship[] = ['WNI', 'WNA'];

export const DEFAULT_VILLAGE_PROFILE: VillageProfile = {
  namaDesa: '',
  kodeDesa: '',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
  kepalaDesa: '',
  sekretarisDesa: '',
  tahunBuku: String(new Date().getFullYear()),
  daftarDusun: ['Dusun I', 'Dusun II', 'Dusun III'],
};
