import {
  BloodType,
  Citizenship,
  EducationLevel,
  FamilyRole,
  Gender,
  MaritalStatus,
  Religion,
  ResidencyStatus,
  Resident,
  VillageProfile,
} from '../types/population';

export const TEMPLATE_HEADERS = [
  'NO_KK',
  'NIK',
  'NAMA_LENGKAP',
  'JENIS_KELAMIN',
  'TEMPAT_LAHIR',
  'TANGGAL_LAHIR',
  'AGAMA',
  'PENDIDIKAN',
  'PEKERJAAN',
  'STATUS_PERKAWINAN',
  'HUBUNGAN_KELUARGA',
  'KEWARGANEGARAAN',
  'GOLONGAN_DARAH',
  'NAMA_AYAH',
  'NAMA_IBU',
  'DUSUN',
  'RT',
  'RW',
  'ALAMAT',
  'STATUS_KEPENDUDUKAN',
  'KETERANGAN',
] as const;

export const TEMPLATE_LABELS_ID: Record<(typeof TEMPLATE_HEADERS)[number], string> = {
  NO_KK: 'No. KK (16 digit)',
  NIK: 'NIK (16 digit)',
  NAMA_LENGKAP: 'Nama Lengkap',
  JENIS_KELAMIN: 'Jenis Kelamin (Laki-laki / Perempuan)',
  TEMPAT_LAHIR: 'Tempat Lahir',
  TANGGAL_LAHIR: 'Tanggal Lahir (YYYY-MM-DD)',
  AGAMA: 'Agama',
  PENDIDIKAN: 'Pendidikan Terakhir',
  PEKERJAAN: 'Pekerjaan',
  STATUS_PERKAWINAN: 'Status Perkawinan',
  HUBUNGAN_KELUARGA: 'Hubungan Keluarga',
  KEWARGANEGARAAN: 'Kewarganegaraan (WNI/WNA)',
  GOLONGAN_DARAH: 'Gol. Darah (A/B/AB/O)',
  NAMA_AYAH: 'Nama Ayah',
  NAMA_IBU: 'Nama Ibu',
  DUSUN: 'Dusun / Kampung',
  RT: 'RT',
  RW: 'RW',
  ALAMAT: 'Alamat Lengkap',
  STATUS_KEPENDUDUKAN: 'Status Kependudukan',
  KETERANGAN: 'Keterangan',
};

function escapeCsvCell(value: string): string {
  const safe = value ?? '';
  if (/[",\n\r;]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function escapeXml(value: string): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an empty CSV template ready for manual input in Excel / LibreOffice Calc.
 * Includes UTF-8 BOM so Indonesian characters and Excel open cleanly.
 */
export function downloadEmptyCsvTemplate(emptyRowCount = 25): void {
  const headerLine = TEMPLATE_HEADERS.join(';');
  const emptyRow = new Array(TEMPLATE_HEADERS.length).fill('').join(';');
  const rows = [headerLine, ...Array.from({ length: emptyRowCount }, () => emptyRow)];
  const csvContent = '\uFEFF' + rows.join('\r\n');
  triggerDownload(csvContent, 'template_kosong_data_penduduk_desa.csv', 'text/csv;charset=utf-8;');
}

/**
 * Generates an Excel 2003 SpreadsheetML (.xls) empty template where NIK, NO_KK, RT, RW, and TANGGAL_LAHIR
 * are explicitly locked as Text cells so Excel NEVER converts 16-digit NIK/KK into 3.20E+15!
 */
export function downloadEmptyExcelTemplate(
  profile: VillageProfile,
  emptyRowCount = 50
): void {
  const villageTitle = profile.namaDesa ? `Desa ${profile.namaDesa}` : 'Desa';
  const rowsXml: string[] = [];

  // Title Row
  rowsXml.push(
    `<Row ss:Height="24"><Cell ss:MergeAcross="${TEMPLATE_HEADERS.length - 1}" ss:StyleID="Title"><Data ss:Type="String">TEMPLATE KOSONG DATA PENDUDUK — ${escapeXml(villageTitle.toUpperCase())}</Data></Cell></Row>`
  );
  // Subtitle / Petunjuk
  rowsXml.push(
    `<Row ss:Height="18"><Cell ss:MergeAcross="${TEMPLATE_HEADERS.length - 1}" ss:StyleID="Subtitle"><Data ss:Type="String">Petunjuk: Isi mulai baris 4. Kolom NIK &amp; No. KK sudah diformat Teks (aman 16 digit). Format Tanggal Lahir: YYYY-MM-DD (contoh: 1990-05-14).</Data></Cell></Row>`
  );

  // Header Row (machine-readable keys in row 3 or clean headers? Use exact TEMPLATE_HEADERS so it's crystal clear)
  const headerCells = TEMPLATE_HEADERS.map(
    (h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`
  ).join('');
  rowsXml.push(`<Row ss:Height="24">${headerCells}</Row>`);

  // Empty data rows with explicit Text style on every cell
  const emptyCells = TEMPLATE_HEADERS.map(
    () => `<Cell ss:StyleID="TextCell"><Data ss:Type="String"></Data></Cell>`
  ).join('');
  for (let i = 0; i < emptyRowCount; i++) {
    rowsXml.push(`<Row ss:Height="20">${emptyCells}</Row>`);
  }

  const columnsXml = TEMPLATE_HEADERS.map((h) => {
    let width = 110;
    if (h === 'NO_KK' || h === 'NIK') width = 135;
    if (h === 'NAMA_LENGKAP' || h === 'ALAMAT') width = 165;
    if (h === 'RT' || h === 'RW' || h === 'GOLONGAN_DARAH') width = 65;
    return `<Column ss:Width="${width}"/>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Title">
      <Font ss:FontName="Calibri" ss:Size="13" ss:Bold="1" ss:Color="#0F5132"/>
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Subtitle">
      <Font ss:FontName="Calibri" ss:Size="9" ss:Italic="1" ss:Color="#475569"/>
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F5132" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E7E50"/>
      </Borders>
    </Style>
    <Style ss:ID="TextCell">
      <NumberFormat ss:Format="@"/>
      <Font ss:FontName="Calibri" ss:Size="10"/>
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="Template Kosong Penduduk">
    <Table>
      ${columnsXml}
      ${rowsXml.join('\n      ')}
    </Table>
  </Worksheet>
</Workbook>`;

  triggerDownload(xml, 'template_kosong_data_penduduk_desa.xls', 'application/vnd.ms-excel;charset=utf-8;');
}

export function exportResidentsToCsv(residents: Resident[], filename = 'data_penduduk_desa.csv'): void {
  const headerLine = TEMPLATE_HEADERS.join(';');
  const lines = residents.map((r) =>
    [
      r.noKk,
      r.nik,
      r.namaLengkap,
      r.jenisKelamin,
      r.tempatLahir,
      r.tanggalLahir,
      r.agama,
      r.pendidikan,
      r.pekerjaan,
      r.statusPerkawinan,
      r.hubunganKeluarga,
      r.kewarganegaraan,
      r.golonganDarah,
      r.namaAyah,
      r.namaIbu,
      r.dusun,
      r.rt,
      r.rw,
      r.alamat,
      r.statusKependudukan,
      r.keterangan,
    ]
      .map((cell) => escapeCsvCell(cell))
      .join(';')
  );

  const csv = '\uFEFF' + [headerLine, ...lines].join('\r\n');
  triggerDownload(csv, filename, 'text/csv;charset=utf-8;');
}

export function exportResidentsToExcel(
  residents: Resident[],
  profile: VillageProfile,
  filename = 'data_penduduk_desa.xls'
): void {
  const villageTitle = profile.namaDesa ? `Desa ${profile.namaDesa}` : 'Desa';
  const rowsXml: string[] = [];

  rowsXml.push(
    `<Row ss:Height="24"><Cell ss:MergeAcross="${TEMPLATE_HEADERS.length - 1}" ss:StyleID="Title"><Data ss:Type="String">BUKU INDUK PENDUDUK — ${escapeXml(villageTitle.toUpperCase())}</Data></Cell></Row>`
  );

  const headerCells = TEMPLATE_HEADERS.map(
    (h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`
  ).join('');
  rowsXml.push(`<Row ss:Height="24">${headerCells}</Row>`);

  for (const r of residents) {
    const vals = [
      r.noKk,
      r.nik,
      r.namaLengkap,
      r.jenisKelamin,
      r.tempatLahir,
      r.tanggalLahir,
      r.agama,
      r.pendidikan,
      r.pekerjaan,
      r.statusPerkawinan,
      r.hubunganKeluarga,
      r.kewarganegaraan,
      r.golonganDarah,
      r.namaAyah,
      r.namaIbu,
      r.dusun,
      r.rt,
      r.rw,
      r.alamat,
      r.statusKependudukan,
      r.keterangan,
    ];
    const cells = vals
      .map((v) => `<Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(v)}</Data></Cell>`)
      .join('');
    rowsXml.push(`<Row ss:Height="20">${cells}</Row>`);
  }

  const columnsXml = TEMPLATE_HEADERS.map((h) => {
    let width = 110;
    if (h === 'NO_KK' || h === 'NIK') width = 135;
    if (h === 'NAMA_LENGKAP' || h === 'ALAMAT') width = 165;
    if (h === 'RT' || h === 'RW' || h === 'GOLONGAN_DARAH') width = 65;
    return `<Column ss:Width="${width}"/>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Title">
      <Font ss:FontName="Calibri" ss:Size="13" ss:Bold="1" ss:Color="#0F5132"/>
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F5132" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="TextCell">
      <NumberFormat ss:Format="@"/>
      <Font ss:FontName="Calibri" ss:Size="10"/>
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="Data Penduduk">
    <Table>
      ${columnsXml}
      ${rowsXml.join('\n      ')}
    </Table>
  </Worksheet>
</Workbook>`;

  triggerDownload(xml, filename, 'application/vnd.ms-excel;charset=utf-8;');
}

export interface CsvParseResult {
  validRows: Resident[];
  errors: { rowNumber: number; message: string }[];
  skippedEmptyRows: number;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result.map((val) => {
    // Strip Excel text formula wrapper like ="3201..."
    const match = val.match(/^="(.*)"$/);
    return match ? match[1] : val;
  });
}

function normalizeGender(raw: string): Gender {
  const val = raw.trim().toLowerCase();
  if (val === 'p' || val === 'perempuan' || val === 'pr' || val === 'wanita') {
    return 'Perempuan';
  }
  return 'Laki-laki';
}

function normalizeDate(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }
  return s;
}

export function parseCsvResidents(rawText: string): CsvParseResult {
  const cleaned = rawText.replace(/^\uFEFF/, '');
  const rawLines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (rawLines.length === 0) {
    return { validRows: [], errors: [{ rowNumber: 1, message: 'Berkas CSV kosong.' }], skippedEmptyRows: 0 };
  }

  const firstLine = rawLines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  const headerCols = splitCsvLine(firstLine, delimiter).map((h) => h.toUpperCase().replace(/\s+/g, '_'));

  const colIndex = (name: string) => headerCols.indexOf(name);
  const idxNama = colIndex('NAMA_LENGKAP');
  const idxNik = colIndex('NIK');

  if (idxNama === -1 && idxNik === -1) {
    return {
      validRows: [],
      errors: [
        {
          rowNumber: 1,
          message:
            'Format header tidak sesuai template. Pastikan menggunakan Template Kosong CSV resmi aplikasi ini.',
        },
      ],
      skippedEmptyRows: 0,
    };
  }

  const validRows: Resident[] = [];
  const errors: { rowNumber: number; message: string }[] = [];
  let skippedEmptyRows = 0;
  const now = new Date().toISOString();

  for (let i = 1; i < rawLines.length; i++) {
    const cols = splitCsvLine(rawLines[i], delimiter);
    const hasAnyValue = cols.some((c) => c.trim().length > 0);
    if (!hasAnyValue) {
      skippedEmptyRows++;
      continue;
    }

    const get = (key: string): string => {
      const idx = colIndex(key);
      return idx >= 0 && idx < cols.length ? cols[idx].trim() : '';
    };

    const namaLengkap = get('NAMA_LENGKAP');
    const nik = get('NIK').replace(/\s+/g, '');

    if (!namaLengkap) {
      errors.push({ rowNumber: i + 1, message: 'Nama lengkap wajib diisi.' });
      continue;
    }

    if (!nik) {
      errors.push({ rowNumber: i + 1, message: `NIK untuk "${namaLengkap}" wajib diisi.` });
      continue;
    }

    validRows.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `res-${Date.now()}-${i}`,
      noKk: get('NO_KK').replace(/\s+/g, ''),
      nik,
      namaLengkap,
      jenisKelamin: normalizeGender(get('JENIS_KELAMIN')),
      tempatLahir: get('TEMPAT_LAHIR'),
      tanggalLahir: normalizeDate(get('TANGGAL_LAHIR')),
      agama: (get('AGAMA') || 'Islam') as Religion,
      pendidikan: (get('PENDIDIKAN') || 'SLTA/Sederajat') as EducationLevel,
      pekerjaan: get('PEKERJAAN') || 'Belum/Tidak Bekerja',
      statusPerkawinan: (get('STATUS_PERKAWINAN') || 'Belum Kawin') as MaritalStatus,
      hubunganKeluarga: (get('HUBUNGAN_KELUARGA') || 'Kepala Keluarga') as FamilyRole,
      kewarganegaraan: (get('KEWARGANEGARAAN') || 'WNI') as Citizenship,
      golonganDarah: (get('GOLONGAN_DARAH') || 'Tidak Tahu') as BloodType,
      namaAyah: get('NAMA_AYAH'),
      namaIbu: get('NAMA_IBU'),
      dusun: get('DUSUN'),
      rt: get('RT').padStart(get('RT') ? 3 : 0, '0'),
      rw: get('RW').padStart(get('RW') ? 3 : 0, '0'),
      alamat: get('ALAMAT'),
      statusKependudukan: (get('STATUS_KEPENDUDUKAN') || 'Tetap') as ResidencyStatus,
      keterangan: get('KETERANGAN'),
      createdAt: now,
      updatedAt: now,
    });
  }

  return { validRows, errors, skippedEmptyRows };
}

export function exportJsonBackup(residents: Resident[], profile: VillageProfile): void {
  const payload = {
    app: 'Buku Induk Desa Offline',
    exportedAt: new Date().toISOString(),
    villageProfile: profile,
    residents,
  };
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(
    JSON.stringify(payload, null, 2),
    `cadangan_offline_penduduk_desa_${dateTag}.json`,
    'application/json;charset=utf-8;'
  );
}
