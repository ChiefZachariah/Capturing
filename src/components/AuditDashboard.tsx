import { useMemo } from 'react';
import { MeterRecord } from '../types/meter';
import {
  Activity,
  Zap,
  Layers,
  MapPin,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface AuditDashboardProps {
  records: MeterRecord[];
  onOpenCapture: () => void;
}

export function AuditDashboard({ records, onOpenCapture }: AuditDashboardProps) {
  // Metrics calculation
  const stats = useMemo(() => {
    const total = records.length;
    let singlePhase = 0;
    let threePhase = 0;
    let smartAmi = 0;
    let prepaid = 0;
    let mdCount = 0;

    const feederCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};
    const dtCounts: Record<string, number> = {};
    const installerCounts: Record<string, number> = {};

    records.forEach((r) => {
      // Phase
      if (r.phaseType.toLowerCase().includes('single')) singlePhase++;
      else if (r.phaseType.toLowerCase().includes('three')) threePhase++;

      // Meter Type
      if (r.meterType.toLowerCase().includes('smart')) smartAmi++;
      else if (r.meterType.toLowerCase().includes('prepaid')) prepaid++;
      if (r.meterType.toLowerCase().includes('demand') || r.tariff.toLowerCase().includes('md')) mdCount++;

      // Groupings
      if (r.feederName) feederCounts[r.feederName] = (feederCounts[r.feederName] || 0) + 1;
      if (r.region) regionCounts[r.region] = (regionCounts[r.region] || 0) + 1;
      if (r.dtCode) dtCounts[r.dtCode] = (dtCounts[r.dtCode] || 0) + 1;
      if (r.installerName) installerCounts[r.installerName] = (installerCounts[r.installerName] || 0) + 1;
    });

    // Top feeders
    const topFeeders = Object.entries(feederCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Top DTs
    const topDts = Object.entries(dtCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      singlePhase,
      threePhase,
      smartAmi,
      prepaid,
      mdCount,
      topFeeders,
      regionCounts,
      topDts,
      installerCounts,
    };
  }, [records]);

  return (
    <div className="space-y-6">
      {/* 4-KPI Strip: Anti-slop, clean single-elevation cards with tabular numerals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Captured */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Commissioned</span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">{stats.total}</span>
            <span className="text-xs text-slate-500 block mt-1">Meters captured in GIS Registry</span>
          </div>
        </div>

        {/* Phase Balance */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phase Distribution</span>
            <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{stats.singlePhase}</span>
              <span className="text-xs text-slate-500">1-Ph</span>
              <span className="text-slate-300">/</span>
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{stats.threePhase}</span>
              <span className="text-xs text-slate-500">3-Ph</span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              {stats.total > 0 ? Math.round((stats.singlePhase / stats.total) * 100) : 0}% Single Phase load
            </span>
          </div>
        </div>

        {/* Smart AMI Adoption */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Smart AMI Grid Tech</span>
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">{stats.smartAmi}</span>
            <span className="text-xs text-slate-500 block mt-1">
              {stats.total > 0 ? Math.round((stats.smartAmi / stats.total) * 100) : 0}% of all installations
            </span>
          </div>
        </div>

        {/* Maximum Demand (MD) Customers */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High-Yield MD Meters</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">{stats.mdCount}</span>
            <span className="text-xs text-slate-500 block mt-1">Commercial / CT-Operated units</span>
          </div>
        </div>
      </div>

      {/* Grid Infrastructure Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Feeders Breakdown */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Feeder Distribution Loading</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">By Meter Volume</span>
          </div>

          <div className="space-y-3">
            {stats.topFeeders.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No feeder records available.</p>
            ) : (
              stats.topFeeders.map(([feeder, count]) => {
                const percent = Math.round((count / (stats.total || 1)) * 100);
                return (
                  <div key={feeder} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[260px]">{feeder}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {count} <span className="font-normal text-slate-500">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Transformer (DT) Utilization & Regions */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Distribution Transformers (DT) Monitored</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Top Mapped Assets</span>
          </div>

          <div className="space-y-3">
            {stats.topDts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No DT records available.</p>
            ) : (
              stats.topDts.map(([dtCode, count]) => (
                <div key={dtCode} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{dtCode}</span>
                    <span className="text-xs text-slate-500">Distribution Substation</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                    {count} {count === 1 ? 'meter' : 'meters'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Field Personnel Productivity Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Installer & Officer Field Activity Audit</h3>
          </div>
          <button
            onClick={onOpenCapture}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
          >
            + New Field Record
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(stats.installerCounts).map(([installer, count]) => (
            <div key={installer} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="block text-xs font-bold text-slate-800">{installer || 'Unassigned'}</span>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Certified Commissions</span>
                <span className="font-mono font-bold text-slate-900">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
