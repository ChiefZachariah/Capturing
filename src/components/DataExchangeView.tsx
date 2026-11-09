import { useState, useRef } from 'react';
import { MeterRecord, CSV_COLUMNS } from '../types/meter';
import {
  exportRecordsToCsv,
  exportRecordsToJson,
  parseCsvToRecords,
  resetToDefaultRecords,
} from '../utils/storage';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface DataExchangeViewProps {
  records: MeterRecord[];
  onUpdateRecords: (records: MeterRecord[]) => void;
}

export function DataExchangeView({ records, onUpdateRecords }: DataExchangeViewProps) {
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setImportStatus({ type: 'error', message: 'Unable to read file contents.' });
        return;
      }

      const res = parseCsvToRecords(text);
      if (res.success && res.records.length > 0) {
        // Merge or replace
        const merged = [...records, ...res.records];
        onUpdateRecords(merged);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${res.records.length} meter records into the registry.`,
        });
      } else {
        setImportStatus({
          type: 'error',
          message: res.error || 'Failed to parse CSV. Ensure valid headers are present.',
        });
      }
    };
    reader.onerror = () => {
      setImportStatus({ type: 'error', message: 'File reading error.' });
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetSampleData = () => {
    if (confirm('Reset meter registry to initial benchmark dataset? This will overwrite recent additions.')) {
      const defaults = resetToDefaultRecords();
      onUpdateRecords(defaults);
      setImportStatus({
        type: 'info',
        message: 'Meter registry reset to default utility commissioning sample.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Utility Data Exchange & CSV Integration
        </h2>
        <p className="text-xs text-slate-500">
          Export field captures for utility billing systems (e.g. Oracle CC&B, SAP IS-U, MDM) or bulk-import historical meter records matching the standard 26 required fields.
        </p>

        {importStatus && (
          <div
            className={`mt-4 p-3 rounded-md text-xs flex items-center gap-2 ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : importStatus.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : importStatus.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Export Meter Records</h3>
            </div>
            <p className="text-xs text-slate-500">
              Download all {records.length} captured meters formatted with the exact 26 column headers required by national energy regulatory commissions and distribution operations.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => exportRecordsToCsv(records)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Standard CSV File
            </button>
            <button
              onClick={() => exportRecordsToJson(records)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              Download JSON Backup
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Import CSV Meter Records</h3>
            </div>
            <p className="text-xs text-slate-500">
              Upload an existing CSV file containing captured meter records. Columns will be automatically matched to the 26 required field definitions.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCsvFileUpload}
              accept=".csv,text/csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              Select CSV File to Import
            </button>

            <button
              onClick={handleResetSampleData}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              Restore Benchmark Demo Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Remote Server Synchronization Configuration Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Remote Server Endpoint & Synchronization
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            HTTP POST /api/sync Active
          </span>
        </div>
        <p className="text-xs text-slate-500">
          When field officers regain connectivity after operating offline, clicking the <strong>Sync Server</strong> button in the top navigation bar transmits all locally stored meter records to the utility database via JSON over HTTPS.
        </p>
        <div className="p-3 bg-slate-50 rounded-md border border-slate-200 font-mono text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Default Endpoint</span>
            <span className="font-bold text-slate-900">/api/sync</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Payload Security</span>
            <span>JSON Array · Auto-batched with Watermarks</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Offline Cache</span>
            <span className="text-emerald-700 font-semibold">Protected in LocalStorage</span>
          </div>
        </div>
      </div>

      {/* Schema Reference Accordion / Specification Box */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" />
          Standard 26-Field Capture Schema Reference
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          All 26 fields requested by the utility engineering specification are fully validated, indexed, and exported:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
          {CSV_COLUMNS.map((col, idx) => (
            <div
              key={col.key}
              className="p-2 rounded bg-slate-50 border border-slate-200/80 flex items-center justify-between"
            >
              <span className="font-medium text-slate-800 truncate">{col.label}</span>
              <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
