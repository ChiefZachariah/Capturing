import { useState, useMemo } from 'react';
import { MeterRecord, REGIONS, METER_TYPES, PHASE_TYPES } from '../types/meter';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  FileSpreadsheet,
  ArrowUpDown,
  CheckSquare,
  Square,
  Columns,
  RotateCcw,
  Camera,
} from 'lucide-react';

interface MeterDataTableProps {
  records: MeterRecord[];
  onViewRecord: (record: MeterRecord) => void;
  onEditRecord: (record: MeterRecord) => void;
  onDeleteRecord: (id: string) => void;
  onExportCsv: (recordsToExport: MeterRecord[]) => void;
  onBatchDelete?: (ids: string[]) => void;
}

export function MeterDataTable({
  records,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
  onExportCsv,
  onBatchDelete,
}: MeterDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedMeterType, setSelectedMeterType] = useState('all');
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [sortField, setSortField] = useState<keyof MeterRecord>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFullColumns, setShowFullColumns] = useState(false);

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (selectedRegion !== 'all' && r.region !== selectedRegion) return false;
        if (selectedMeterType !== 'all' && r.meterType !== selectedMeterType) return false;
        if (selectedPhase !== 'all' && r.phaseType !== selectedPhase) return false;

        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          r.customerName.toLowerCase().includes(q) ||
          r.meterNumber.toLowerCase().includes(q) ||
          r.accountNumber.toLowerCase().includes(q) ||
          r.dtCode.toLowerCase().includes(q) ||
          r.dtName.toLowerCase().includes(q) ||
          r.poleNumber.toLowerCase().includes(q) ||
          r.feederName.toLowerCase().includes(q) ||
          r.installerName.toLowerCase().includes(q) ||
          r.capturingOfficer.toLowerCase().includes(q) ||
          r.regionalCodeNumber.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const valA = String(a[sortField] || '');
        const valB = String(b[sortField] || '');
        const comparison = valA.localeCompare(valB, undefined, { numeric: true });
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [records, searchTerm, selectedRegion, selectedMeterType, selectedPhase, sortField, sortOrder]);

  const toggleSort = (field: keyof MeterRecord) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleExportSelected = () => {
    const selected = filteredRecords.filter((r) => selectedIds.has(r.id));
    onExportCsv(selected.length > 0 ? selected : filteredRecords);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs flex flex-col">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Customer, Meter #, Account, DT Code, Pole, Feeder..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Actions & Column Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFullColumns(!showFullColumns)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                showFullColumns
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Toggle expanded 26-column view"
            >
              <Columns className="w-3.5 h-3.5" />
              {showFullColumns ? 'Standard Columns' : 'All 26 Fields'}
            </button>

            <button
              onClick={handleExportSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-medium transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export CSV {selectedIds.size > 0 ? `(${selectedIds.size})` : `(${filteredRecords.length})`}
            </button>

            {selectedIds.size > 0 && onBatchDelete && (
              <button
                onClick={() => {
                  if (confirm(`Delete ${selectedIds.size} selected meter records?`)) {
                    onBatchDelete(Array.from(selectedIds));
                    setSelectedIds(new Set());
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-md text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Filters Strip */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Filters:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-slate-500">Region:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-slate-500">Meter Type:</label>
            <select
              value={selectedMeterType}
              onChange={(e) => setSelectedMeterType(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Meter Types</option>
              {METER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-slate-500">Phase:</label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Phases</option>
              {PHASE_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {(selectedRegion !== 'all' || selectedMeterType !== 'all' || selectedPhase !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedRegion('all');
                setSelectedMeterType('all');
                setSelectedPhase('all');
                setSearchTerm('');
              }}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 select-none">
              <th className="py-2.5 px-3 w-8">
                <button onClick={handleSelectAll} className="text-slate-500 hover:text-slate-900">
                  {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              {/* SN */}
              <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50" onClick={() => toggleSort('sn')}>
                <div className="flex items-center gap-1">
                  <span>SN</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Meter Number */}
              <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50" onClick={() => toggleSort('meterNumber')}>
                <div className="flex items-center gap-1">
                  <span>Meter Number</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Customer Name */}
              <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50" onClick={() => toggleSort('customerName')}>
                <div className="flex items-center gap-1">
                  <span>Customer Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Account Number */}
              <th className="py-2.5 px-3">Account Number</th>

              {/* Meter Type */}
              <th className="py-2.5 px-3">Meter Type</th>

              {/* Phase */}
              <th className="py-2.5 px-3">Phase Type</th>

              {/* Feeder & Region */}
              <th className="py-2.5 px-3">Feeder / Region</th>

              {/* DT Code & Pole */}
              <th className="py-2.5 px-3">DT Code · Pole</th>

              {/* GPS Coordinates */}
              <th className="py-2.5 px-3">Lat, Long</th>

              {/* Optional Expanded Columns */}
              {showFullColumns && (
                <>
                  <th className="py-2.5 px-3">Regional Code</th>
                  <th className="py-2.5 px-3">Customer Address</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Tariff</th>
                  <th className="py-2.5 px-3">Voltage Type</th>
                  <th className="py-2.5 px-3">DT Name</th>
                  <th className="py-2.5 px-3">Upriser</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Source Type</th>
                  <th className="py-2.5 px-3">Installer ID</th>
                  <th className="py-2.5 px-3">Installer Name</th>
                  <th className="py-2.5 px-3">Capturing Officer</th>
                  <th className="py-2.5 px-3">Remark</th>
                </>
              )}

              {/* Date */}
              <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50" onClick={() => toggleSort('date')}>
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Actions */}
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={showFullColumns ? 27 : 12} className="py-12 text-center text-slate-500">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="font-semibold text-slate-700">No electricity meters found</p>
                    <p className="text-xs text-slate-500">
                      Try adjusting your search criteria or capture a new meter using the button above.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const isSelected = selectedIds.has(record.id);

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3">
                      <button onClick={() => handleToggleSelect(record.id)} className="text-slate-400 hover:text-slate-700">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* SN */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {record.sn}
                    </td>

                    {/* Meter Number */}
                    <td className="py-2.5 px-3 font-mono font-semibold text-emerald-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {record.meterPhoto && (
                          <span title="Visual meter photo attached">
                            <Camera className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          </span>
                        )}
                        <span>{record.meterNumber}</span>
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[180px] truncate" title={record.customerName}>
                      {record.customerName}
                    </td>

                    {/* Account Number */}
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {record.accountNumber}
                    </td>

                    {/* Meter Type */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                      {record.meterType}
                    </td>

                    {/* Phase */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                      {record.phaseType.split('(')[0]}
                    </td>

                    {/* Feeder / Region */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800 block truncate max-w-[150px]" title={record.feederName}>
                        {record.feederName}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{record.region}</span>
                    </td>

                    {/* DT Code · Pole */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                      <span className="font-semibold text-slate-800">{record.dtCode}</span>
                      <span className="text-slate-400 ml-1">· {record.poleNumber}</span>
                    </td>

                    {/* GPS Coordinates */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {record.latitude ? `${record.latitude}, ${record.longitude}` : 'No GPS'}
                    </td>

                    {/* Optional full 26 columns */}
                    {showFullColumns && (
                      <>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{record.regionalCodeNumber}</td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-600" title={record.customerAddress}>
                          {record.customerAddress}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{record.phoneNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{record.tariff}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{record.voltageType}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{record.dtName}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{record.upriser}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{record.source}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{record.sourceType}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{record.installerId}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{record.installerName}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{record.capturingOfficer}</td>
                        <td className="py-2.5 px-3 max-w-[150px] truncate text-slate-600" title={record.remark}>
                          {record.remark}
                        </td>
                      </>
                    )}

                    {/* Date */}
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {record.date}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewRecord(record)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-200/60 rounded"
                          title="View Commissioning Certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditRecord(record)}
                          className="p-1 text-slate-500 hover:text-sky-700 hover:bg-slate-200/60 rounded"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete meter record #${record.meterNumber} (${record.customerName})?`)) {
                              onDeleteRecord(record.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-red-700 hover:bg-slate-200/60 rounded"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination & Metrics Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Showing {filteredRecords.length} of {records.length} captured meters</span>
          {selectedIds.size > 0 && (
            <span className="font-semibold text-emerald-700">({selectedIds.size} selected)</span>
          )}
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          VoltGrid · Utility Field Asset Registry
        </div>
      </div>
    </div>
  );
}
