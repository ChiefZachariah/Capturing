import { useState, useRef } from 'react';
import { FeederMapping, DtEntry } from '../types/meter';
import {
  parseFeedersCsv,
  downloadFeedersCsvTemplate,
  exportFeedersToCsv,
  resetStoredFeeders,
} from '../utils/storage';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  Building2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Zap,
} from 'lucide-react';

interface FeederHierarchyManagerProps {
  feeders: FeederMapping[];
  onUpdateFeeders: (feeders: FeederMapping[]) => void;
  onSelectFeederForCapture?: (feederName: string, dtCode?: string) => void;
}

export function FeederHierarchyManager({
  feeders,
  onUpdateFeeders,
  onSelectFeederForCapture,
}: FeederHierarchyManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [expandedFeeders, setExpandedFeeders] = useState<Set<string>>(new Set(feeders.map((f) => f.feederName)));
  const [isAddFeederOpen, setIsAddFeederOpen] = useState(false);
  const [newFeederName, setNewFeederName] = useState('');
  const [newFeederRegion, setNewFeederRegion] = useState('Ikeja');
  const [newFeederSource, setNewFeederSource] = useState('');
  const [newDtName, setNewDtName] = useState('');
  const [newDtCode, setNewDtCode] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalDts = feeders.reduce((acc, f) => acc + f.dts.length, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setStatusMsg({ type: 'error', text: 'Could not read file.' });
        return;
      }

      const res = parseFeedersCsv(text);
      if (res.success && res.feeders.length > 0) {
        onUpdateFeeders(res.feeders);
        setExpandedFeeders(new Set(res.feeders.map((f) => f.feederName)));
        setStatusMsg({
          type: 'success',
          text: `Successfully loaded ${res.feeders.length} Feeders and ${res.totalDts} Distribution Transformers from file!`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to parse Feeder/DT file. Please verify CSV structure.',
        });
      }
    };
    reader.onerror = () => {
      setStatusMsg({ type: 'error', text: 'File read error.' });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (confirm('Reset Feeder and DT hierarchy to default benchmark utility catalog?')) {
      const def = resetStoredFeeders();
      onUpdateFeeders(def);
      setExpandedFeeders(new Set(def.map((f) => f.feederName)));
      setStatusMsg({ type: 'info', text: 'Feeder and DT directory reset to standard utility hierarchy.' });
    }
  };

  const toggleExpand = (feederName: string) => {
    const next = new Set(expandedFeeders);
    if (next.has(feederName)) {
      next.delete(feederName);
    } else {
      next.add(feederName);
    }
    setExpandedFeeders(next);
  };

  const handleDeleteFeeder = (feederName: string) => {
    if (confirm(`Remove feeder "${feederName}" and all its DTs?`)) {
      const updated = feeders.filter((f) => f.feederName !== feederName);
      onUpdateFeeders(updated);
      setStatusMsg({ type: 'info', text: `Feeder "${feederName}" removed.` });
    }
  };

  const handleDeleteDt = (feederName: string, dtCode: string) => {
    const updated = feeders.map((f) => {
      if (f.feederName === feederName) {
        return {
          ...f,
          dts: f.dts.filter((d) => d.dtCode !== dtCode),
        };
      }
      return f;
    });
    onUpdateFeeders(updated);
  };

  const handleCreateFeeder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeederName.trim()) return;

    const existing = feeders.find((f) => f.feederName.toLowerCase() === newFeederName.trim().toLowerCase());
    if (existing) {
      if (newDtName.trim() || newDtCode.trim()) {
        existing.dts.push({
          dtName: newDtName.trim() || `DT ${newDtCode.trim()}`,
          dtCode: newDtCode.trim() || `DT-${Date.now().toString().slice(-4)}`,
        });
        onUpdateFeeders([...feeders]);
      }
    } else {
      const newFeeder: FeederMapping = {
        feederName: newFeederName.trim(),
        region: newFeederRegion,
        source: newFeederSource.trim() || 'Central Injection Substation',
        sourceType: '33/11kV Injection Substation',
        dts: newDtCode.trim() || newDtName.trim()
          ? [{ dtName: newDtName.trim() || `DT ${newDtCode}`, dtCode: newDtCode.trim() || 'DT-NEW' }]
          : [],
      };
      onUpdateFeeders([newFeeder, ...feeders]);
    }

    setNewFeederName('');
    setNewDtName('');
    setNewDtCode('');
    setIsAddFeederOpen(false);
    setStatusMsg({ type: 'success', text: 'Feeder / DT added successfully.' });
  };

  const filteredFeeders = feeders.filter((f) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      f.feederName.toLowerCase().includes(q) ||
      (f.region && f.region.toLowerCase().includes(q)) ||
      f.dts.some((d) => d.dtName.toLowerCase().includes(q) || d.dtCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Feeder & Distribution Transformer (DT) Network Directory
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upload your utility feeder file. When capturing a meter, selecting any feeder will automatically display and populate its associated DT Name and Code.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-md">
              {feeders.length} Feeders · {totalDts} DTs
            </span>
          </div>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-md text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMsg.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="flex-1">{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}
      </div>

      {/* Action Strip: File Upload, Download Template, Export */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upload Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-emerald-600" />
              Upload Feeders File
            </span>
            <p className="text-[11px] text-slate-500">
              Upload your CSV containing Feeder Name, DT Name, and DT Code.
            </p>
          </div>

          <div className="mt-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,text/csv,text/plain"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload CSV File
            </button>
          </div>
        </div>

        {/* Template Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              CSV Format Template
            </span>
            <p className="text-[11px] text-slate-500">
              Download pre-formatted CSV template with sample feeders & DT columns.
            </p>
          </div>

          <div className="mt-3">
            <button
              onClick={downloadFeedersCsvTemplate}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download Template (.csv)
            </button>
          </div>
        </div>

        {/* Export / Reset Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Directory Tools
            </span>
            <p className="text-[11px] text-slate-500">
              Backup current Feeder/DT catalog or restore standard baseline.
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => exportFeedersToCsv(feeders)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
              title="Download currently loaded hierarchy"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
              title="Reset to default feeders"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Feeders Explorer */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Feeder, Region, DT Name or DT Code..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddFeederOpen(!isAddFeederOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddFeederOpen ? 'Close Form' : 'Add Feeder / DT'}
            </button>
          </div>
        </div>

        {/* Manual Add Form (Collapsible) */}
        {isAddFeederOpen && (
          <form onSubmit={handleCreateFeeder} className="p-4 bg-emerald-50/40 border-b border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Add Feeder & Distribution Transformer Entry
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Feeder Name *</label>
                <input
                  type="text"
                  required
                  value={newFeederName}
                  onChange={(e) => setNewFeederName(e.target.value)}
                  placeholder="e.g. 11kV Central Commercial Feeder"
                  className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">DT Name (Transformer)</label>
                <input
                  type="text"
                  value={newDtName}
                  onChange={(e) => setNewDtName(e.target.value)}
                  placeholder="e.g. DT 500kVA Main Plaza"
                  className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">DT Code *</label>
                <input
                  type="text"
                  value={newDtCode}
                  onChange={(e) => setNewDtCode(e.target.value)}
                  placeholder="e.g. DT-CEN-001"
                  className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddFeederOpen(false)}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                Save Feeder & DT
              </button>
            </div>
          </form>
        )}

        {/* Feeders Accordion List */}
        <div className="divide-y divide-slate-100">
          {filteredFeeders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No feeders match your search. Upload a CSV file or add a new feeder above.
            </div>
          ) : (
            filteredFeeders.map((feeder) => {
              const isExpanded = expandedFeeders.has(feeder.feederName);

              return (
                <div key={feeder.feederName} className="hover:bg-slate-50/50 transition-colors">
                  {/* Feeder Row Header */}
                  <div
                    onClick={() => toggleExpand(feeder.feederName)}
                    className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-slate-400 hover:text-slate-700 p-0.5">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{feeder.feederName}</span>
                          {feeder.region && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {feeder.region}
                            </span>
                          )}
                        </div>
                        {feeder.source && (
                          <div className="text-[11px] text-slate-400">
                            Source: {feeder.source} {feeder.sourceType ? `· ${feeder.sourceType}` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {feeder.dts.length} {feeder.dts.length === 1 ? 'DT' : 'DTs'}
                      </span>
                      {onSelectFeederForCapture && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFeederForCapture(feeder.feederName);
                          }}
                          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded text-xs font-medium transition-colors"
                          title="Capture a meter on this feeder"
                        >
                          <Zap className="w-3 h-3 text-emerald-600" />
                          Capture on Feeder
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFeeder(feeder.feederName);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete Feeder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* DT List Sub-Table */}
                  {isExpanded && (
                    <div className="bg-slate-50/80 px-8 py-3 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider flex items-center justify-between">
                        <span>Distribution Transformers (DTs) under this feeder:</span>
                        <span className="font-mono text-[10px] text-slate-400">Auto-fills DT Name & Code</span>
                      </div>

                      {feeder.dts.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-1">
                          No transformers listed for this feeder yet. Add one or upload file.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                          {feeder.dts.map((dt) => (
                            <div
                              key={dt.dtCode}
                              className="p-2.5 bg-white rounded border border-slate-200 flex items-center justify-between shadow-2xs group"
                            >
                              <div className="truncate pr-2">
                                <span className="font-mono text-xs font-bold text-slate-900 block truncate">
                                  {dt.dtCode}
                                </span>
                                <span className="text-[11px] text-slate-600 block truncate">
                                  {dt.dtName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {onSelectFeederForCapture && (
                                  <button
                                    onClick={() => onSelectFeederForCapture(feeder.feederName, dt.dtCode)}
                                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                    title="Capture meter on this specific DT"
                                  >
                                    <Zap className="w-3 h-3 text-emerald-600" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteDt(feeder.feederName, dt.dtCode)}
                                  className="p-1 text-slate-300 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove DT"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
