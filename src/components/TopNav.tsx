import { Zap, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export type NavTab = 'registry' | 'map' | 'feeders' | 'analytics' | 'import-export';

interface TopNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenCapture: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  onSync: () => void;
}

export function TopNav({
  activeTab,
  onTabChange,
  onOpenCapture,
  isOnline,
  isSyncing,
  lastSyncTime,
  onSync,
}: TopNavProps) {
  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never synced';
    try {
      const date = new Date(timestamp);
      return `Synced ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Synced';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8 px-4 sm:px-6 py-3">
        {/* Zone 1: Single element wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            VoltGrid Meter Capture
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <button
            onClick={() => onTabChange('registry')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'registry'
                ? 'text-emerald-700 border-b-2 border-emerald-600 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Meter Registry
          </button>
          <button
            onClick={() => onTabChange('feeders')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'feeders'
                ? 'text-emerald-700 border-b-2 border-emerald-600 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Feeders & DTs
          </button>
          <button
            onClick={() => onTabChange('map')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'map'
                ? 'text-emerald-700 border-b-2 border-emerald-600 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            GIS Field Map
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'analytics'
                ? 'text-emerald-700 border-b-2 border-emerald-600 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Audit Analytics
          </button>
          <button
            onClick={() => onTabChange('import-export')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'import-export'
                ? 'text-emerald-700 border-b-2 border-emerald-600 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Data Exchange
          </button>
        </nav>

        {/* Zone 3: Network Status, Manual Sync & Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Network Status Indicator */}
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors select-none ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title={
              isOnline
                ? 'Connected to Network. Real-time sync available.'
                : 'Offline mode active. All meter captures and edits are safely cached in local storage.'
            }
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Manual Push Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors shadow-2xs whitespace-nowrap disabled:opacity-60 ${
              isOnline
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
            title={
              isOnline
                ? `Push local captures to remote server endpoint (${formatLastSync(lastSyncTime)})`
                : 'Device is offline. Connect to internet to push data.'
            }
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span className="hidden md:inline">
              {isSyncing ? 'Syncing...' : 'Sync Server'}
            </span>
            <span className="md:hidden">
              {isSyncing ? 'Sync...' : 'Sync'}
            </span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenCapture}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Capture Meter</span>
            <span className="sm:hidden">Capture</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-between border-t border-slate-200 px-3 py-2 bg-slate-50 text-xs font-medium overflow-x-auto gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange('registry')}
            className={`px-2 py-1 rounded whitespace-nowrap ${
              activeTab === 'registry' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Registry
          </button>
          <button
            onClick={() => onTabChange('feeders')}
            className={`px-2 py-1 rounded whitespace-nowrap ${
              activeTab === 'feeders' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Feeders
          </button>
          <button
            onClick={() => onTabChange('map')}
            className={`px-2 py-1 rounded whitespace-nowrap ${
              activeTab === 'map' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            GIS Map
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`px-2 py-1 rounded whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => onTabChange('import-export')}
            className={`px-2 py-1 rounded whitespace-nowrap ${
              activeTab === 'import-export' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Exchange
          </button>
        </div>

        {/* Mobile network badge */}
        <div className="sm:hidden flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 shrink-0">
          <span
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}
          />
          <span className="text-slate-700">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
}
