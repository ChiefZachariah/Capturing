import { useState, useEffect } from 'react';
import { MeterRecord, FeederMapping } from './types/meter';
import {
  getStoredRecords,
  saveStoredRecords,
  getStoredFeeders,
  saveStoredFeeders,
  generateNextSn,
  exportRecordsToCsv,
} from './utils/storage';
import {
  pushRecordsToRemote,
  getLastSyncTime,
  checkServerReachability,
} from './utils/syncService';
import { TopNav, NavTab } from './components/TopNav';
import { MeterDataTable } from './components/MeterDataTable';
import { GisMapView } from './components/GisMapView';
import { AuditDashboard } from './components/AuditDashboard';
import { DataExchangeView } from './components/DataExchangeView';
import { FeederHierarchyManager } from './components/FeederHierarchyManager';
import { CaptureFormModal } from './components/CaptureFormModal';
import { MeterDetailModal } from './components/MeterDetailModal';
import { Plus, CheckCircle2, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<MeterRecord[]>([]);
  const [feeders, setFeeders] = useState<FeederMapping[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>('registry');
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MeterRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MeterRecord | null>(null);
  const [preselectedFeeder, setPreselectedFeeder] = useState<{ feederName: string; dtCode?: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getLastSyncTime());

  // Initialize from LocalStorage & Network Listeners
  useEffect(() => {
    const loadedRecords = getStoredRecords();
    setRecords(loadedRecords);

    const loadedFeeders = getStoredFeeders();
    setFeeders(loadedFeeders);

    // Network status listeners
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network connection restored. Ready to sync local captures with server.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Operating in offline mode. Captures will be stored securely in local browser storage.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial server check
    checkServerReachability().then((reachable) => {
      if (!reachable && navigator.onLine) {
        // Can operate in local-first mode
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save records to LocalStorage
  const handleUpdateRecords = (newRecords: MeterRecord[]) => {
    setRecords(newRecords);
    saveStoredRecords(newRecords);
  };

  // Save feeders to LocalStorage
  const handleUpdateFeeders = (newFeeders: FeederMapping[]) => {
    setFeeders(newFeeders);
    saveStoredFeeders(newFeeders);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // Manual Sync Push to Remote Endpoint
  const handleSync = async () => {
    if (!isOnline) {
      showToast('Cannot sync: Device is currently offline. Reconnect to push data.');
      return;
    }
    if (records.length === 0) {
      showToast('No meter records available to synchronize.');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await pushRecordsToRemote(records);
      if (res.success) {
        setLastSyncTime(res.timestamp);
        showToast(`Sync complete: ${res.syncedCount} meter records successfully pushed to central server.`);
      } else {
        showToast(res.message);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown sync failure';
      showToast(`Sync failed: ${errorMsg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handlers
  const handleSaveRecord = (record: MeterRecord) => {
    const exists = records.some((r) => r.id === record.id);
    let updated: MeterRecord[];
    if (exists) {
      updated = records.map((r) => (r.id === record.id ? record : r));
      showToast(`Updated meter record #${record.meterNumber} (${record.customerName}).`);
    } else {
      updated = [record, ...records];
      showToast(`New meter #${record.meterNumber} captured and commissioned successfully.`);
    }
    handleUpdateRecords(updated);
    setEditingRecord(null);
    setPreselectedFeeder(null);
  };

  const handleDeleteRecord = (id: string) => {
    const toDelete = records.find((r) => r.id === id);
    const updated = records.filter((r) => r.id !== id);
    handleUpdateRecords(updated);
    if (toDelete) {
      showToast(`Deleted meter record #${toDelete.meterNumber}.`);
    }
  };

  const handleBatchDelete = (ids: string[]) => {
    const updated = records.filter((r) => !ids.includes(r.id));
    handleUpdateRecords(updated);
    showToast(`Deleted ${ids.length} meter records.`);
  };

  const handleStartNewCapture = () => {
    setEditingRecord(null);
    setPreselectedFeeder(null);
    setIsCaptureModalOpen(true);
  };

  const handleStartEdit = (record: MeterRecord) => {
    setEditingRecord(record);
    setPreselectedFeeder(null);
    setIsCaptureModalOpen(true);
  };

  const handleSelectFeederForCapture = (feederName: string, dtCode?: string) => {
    setEditingRecord(null);
    setPreselectedFeeder({ feederName, dtCode });
    setIsCaptureModalOpen(true);
  };

  const nextSn = generateNextSn(records);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar with live Network Status & Sync Button */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCapture={handleStartNewCapture}
        isOnline={isOnline}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onSync={handleSync}
      />

      {/* Global Success / Notice Notification Banner */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Contextual Header / Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>VoltGrid Utility Operations</span>
              <span>/</span>
              <span className="text-slate-900 capitalize font-semibold">
                {activeTab === 'feeders' ? 'Feeders & DT Directory' : activeTab}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {activeTab === 'registry' && 'Electricity Meter Capture Registry'}
              {activeTab === 'feeders' && 'Feeders & Distribution Transformers (DT) Hierarchy'}
              {activeTab === 'map' && 'GIS Spatial Asset & Field Distribution Map'}
              {activeTab === 'analytics' && 'Distribution Network & Commissioning Audit'}
              {activeTab === 'import-export' && 'Data Exchange & External Integration'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{records.length} Verified Meters</span>
            </span>

            <button
              onClick={handleStartNewCapture}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              + Capture Meter
            </button>
          </div>
        </div>

        {/* View Switcher Views */}
        {activeTab === 'registry' && (
          <MeterDataTable
            records={records}
            onViewRecord={(record) => setViewingRecord(record)}
            onEditRecord={handleStartEdit}
            onDeleteRecord={handleDeleteRecord}
            onExportCsv={(recordsToExport) => exportRecordsToCsv(recordsToExport)}
            onBatchDelete={handleBatchDelete}
          />
        )}

        {activeTab === 'feeders' && (
          <FeederHierarchyManager
            feeders={feeders}
            onUpdateFeeders={handleUpdateFeeders}
            onSelectFeederForCapture={handleSelectFeederForCapture}
          />
        )}

        {activeTab === 'map' && (
          <div className="space-y-4">
            <GisMapView
              records={records}
              onSelectRecord={(record) => setViewingRecord(record)}
              selectedRecordId={viewingRecord?.id}
            />
            <p className="text-xs text-slate-500 italic">
              Click any map pin to inspect meter details or open the official commissioning certificate.
            </p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AuditDashboard
            records={records}
            onOpenCapture={handleStartNewCapture}
          />
        )}

        {activeTab === 'import-export' && (
          <DataExchangeView
            records={records}
            onUpdateRecords={handleUpdateRecords}
          />
        )}
      </main>

      {/* Field Capture Modal (All 26 fields with Feeder & DT auto-fill + Meter Photo Capture) */}
      <CaptureFormModal
        isOpen={isCaptureModalOpen}
        onClose={() => {
          setIsCaptureModalOpen(false);
          setEditingRecord(null);
          setPreselectedFeeder(null);
        }}
        onSave={handleSaveRecord}
        initialData={editingRecord}
        suggestedSn={nextSn}
        feeders={feeders}
        defaultFeederName={preselectedFeeder?.feederName}
        defaultDtCode={preselectedFeeder?.dtCode}
      />

      {/* Commissioning Certificate & Job Sheet Modal (with Photo Thumbnail) */}
      <MeterDetailModal
        record={viewingRecord}
        isOpen={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        onEdit={(record) => {
          setViewingRecord(null);
          handleStartEdit(record);
        }}
      />

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-800">VoltGrid Meter Capture System</span>
            <span className="text-slate-300">·</span>
            <span>26-Parameter Electricity Asset Standard</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Offline-Ready · GPS Precision · Camera Inspection · Remote Server Sync
          </div>
        </div>
      </footer>
    </div>
  );
}
