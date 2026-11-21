import { ChangeEvent } from 'react';
import {
  Download,
  FileSpreadsheet,
  FolderDown,
  Printer,
  Upload,
  UserPlus,
} from 'lucide-react';
import { Resident, VillageProfile } from '../types/population';
import {
  downloadEmptyCsvTemplate,
  downloadEmptyExcelTemplate,
  exportJsonBackup,
  exportResidentsToCsv,
  exportResidentsToExcel,
} from '../lib/csvAndExcel';

interface QuickActionBarProps {
  residents: Resident[];
  profile: VillageProfile;
  onAddNew: () => void;
  onCsvFileSelected: (file: File) => void;
  onPrintBukuInduk: () => void;
  onPrintBlankTemplate: () => void;
}

export function QuickActionBar({
  residents,
  profile,
  onAddNew,
  onCsvFileSelected,
  onPrintBukuInduk,
  onPrintBlankTemplate,
}: QuickActionBarProps) {
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onCsvFileSelected(file);
    }
    e.target.value = '';
  }

  return (
    <div className="mb-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 no-print">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium btn-accent rounded-md whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Input Manual
        </button>

        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap shrink-0">
          <Upload className="w-3.5 h-3.5 text-accent" />
          Impor CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        <button
          type="button"
          disabled={residents.length === 0}
          onClick={() => exportResidentsToExcel(residents, profile)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-45 whitespace-nowrap shrink-0"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
          Ekspor Excel
        </button>

        <button
          type="button"
          disabled={residents.length === 0}
          onClick={() => exportResidentsToCsv(residents)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-45 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          Ekspor CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => downloadEmptyExcelTemplate(profile, 50)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          Template Excel
        </button>

        <button
          type="button"
          onClick={() => downloadEmptyCsvTemplate(25)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          Template CSV
        </button>

        <button
          type="button"
          onClick={() => exportJsonBackup(residents, profile)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
        >
          <FolderDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          Cadangan JSON
        </button>

        <button
          type="button"
          onClick={residents.length > 0 ? onPrintBukuInduk : onPrintBlankTemplate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          {residents.length > 0 ? 'Cetak Data' : 'Cetak Kosong'}
        </button>
      </div>
    </div>
  );
}
