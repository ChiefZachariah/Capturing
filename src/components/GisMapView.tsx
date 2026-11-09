import { useState, useMemo } from 'react';
import { MeterRecord } from '../types/meter';
import { MapPin, Navigation, Eye, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface GisMapViewProps {
  records: MeterRecord[];
  onSelectRecord: (record: MeterRecord) => void;
  onCoordinatePick?: (lat: string, lng: string) => void;
  selectedRecordId?: string | null;
}

export function GisMapView({ records, onSelectRecord, onCoordinatePick, selectedRecordId }: GisMapViewProps) {
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(1);
  const [activePin, setActivePin] = useState<MeterRecord | null>(null);

  // Filter valid coordinate records
  const validRecords = useMemo(() => {
    return records
      .map((r) => {
        const lat = parseFloat(r.latitude);
        const lng = parseFloat(r.longitude);
        return {
          ...r,
          parsedLat: isNaN(lat) ? null : lat,
          parsedLng: isNaN(lng) ? null : lng,
        };
      })
      .filter((r) => r.parsedLat !== null && r.parsedLng !== null) as (MeterRecord & { parsedLat: number; parsedLng: number })[];
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (filterPhase === 'all') return validRecords;
    if (filterPhase === 'single') return validRecords.filter((r) => r.phaseType.toLowerCase().includes('single'));
    if (filterPhase === 'three') return validRecords.filter((r) => r.phaseType.toLowerCase().includes('three'));
    if (filterPhase === 'smart') return validRecords.filter((r) => r.meterType.toLowerCase().includes('smart'));
    return validRecords;
  }, [validRecords, filterPhase]);

  // Compute bounding box
  const bounds = useMemo(() => {
    if (filteredRecords.length === 0) {
      return { minLat: 4.0, maxLat: 13.0, minLng: 2.5, maxLng: 14.5 };
    }
    const lats = filteredRecords.map((r) => r.parsedLat);
    const lngs = filteredRecords.map((r) => r.parsedLng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Add small padding
    const latPad = Math.max((maxLat - minLat) * 0.15, 0.05);
    const lngPad = Math.max((maxLng - minLng) * 0.15, 0.05);

    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad,
    };
  }, [filteredRecords]);

  const getPositionPercent = (lat: number, lng: number) => {
    const latSpan = bounds.maxLat - bounds.minLat || 1;
    const lngSpan = bounds.maxLng - bounds.minLng || 1;
    // Map latitude: higher is north (top)
    const top = ((bounds.maxLat - lat) / latSpan) * 100;
    // Map longitude: higher is east (right)
    const left = ((lng - bounds.minLng) / lngSpan) * 100;
    return { top: Math.max(4, Math.min(94, top)), left: Math.max(4, Math.min(96, left)) };
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-[650px] shadow-sm">
      {/* Map Control Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">GIS Meter Spatial Distribution</span>
          <span className="text-xs text-slate-500 font-mono">({filteredRecords.length} mapped points)</span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Filter:</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded-md">
            <button
              onClick={() => setFilterPhase('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                filterPhase === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterPhase('single')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                filterPhase === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Phase
            </button>
            <button
              onClick={() => setFilterPhase('three')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                filterPhase === 'three' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Three Phase
            </button>
            <button
              onClick={() => setFilterPhase('smart')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                filterPhase === 'smart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Smart AMI
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 ml-2 border-l border-slate-300 pl-2">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
              className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
              className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div className="relative flex-1 bg-slate-900 overflow-hidden cursor-crosshair select-none">
        {/* Vector Grid & Coordinate Topology Background */}
        <div 
          className="absolute inset-0 transition-transform duration-200 ease-out origin-center"
          style={{ transform: `scale(${zoom})` }}
          onClick={(e) => {
            if (onCoordinatePick) {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = (e.clientX - rect.left) / rect.width;
              const clickY = (e.clientY - rect.top) / rect.height;
              const latSpan = bounds.maxLat - bounds.minLat;
              const lngSpan = bounds.maxLng - bounds.minLng;
              const pickedLat = (bounds.maxLat - clickY * latSpan).toFixed(6);
              const pickedLng = (bounds.minLng + clickX * lngSpan).toFixed(6);
              onCoordinatePick(pickedLat, pickedLng);
            }
          }}
        >
          {/* Subtle Grid Lines */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
              backgroundSize: '24px 24px, 48px 48px, 48px 48px'
            }}
          />

          {/* Coordinate Axis Labels */}
          <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500 pointer-events-none">
            LAT: {bounds.maxLat.toFixed(4)}°N | LNG: {bounds.minLng.toFixed(4)}°E
          </div>
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-500 pointer-events-none">
            LAT: {bounds.minLat.toFixed(4)}°N | LNG: {bounds.maxLng.toFixed(4)}°E
          </div>

          {/* Plotted Meter Pins */}
          {filteredRecords.map((item) => {
            const pos = getPositionPercent(item.parsedLat, item.parsedLng);
            const isSelected = selectedRecordId === item.id || activePin?.id === item.id;
            const isThreePhase = item.phaseType.toLowerCase().includes('three');
            const isSmart = item.meterType.toLowerCase().includes('smart');

            return (
              <div
                key={item.id}
                style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePin(item);
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-150 group z-10 ${
                  isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                }`}
              >
                {/* Pin visual */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 transition-colors ${
                    isSelected
                      ? 'bg-amber-400 border-white text-slate-900 ring-4 ring-amber-400/40'
                      : isThreePhase
                      ? 'bg-sky-500 border-white text-white'
                      : isSmart
                      ? 'bg-emerald-500 border-white text-white'
                      : 'bg-indigo-600 border-white text-white'
                  }`}
                  title={`${item.meterNumber} - ${item.customerName}`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                </div>

                {/* Micro Label on Hover */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-6 bg-slate-950/90 text-white text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700">
                  {item.meterNumber}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Meter Inspection Popover */}
        {activePin && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-40 text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
              <div>
                <div className="text-[11px] font-mono uppercase text-emerald-700 tracking-wider font-semibold">
                  SN: {activePin.sn} · Meter #{activePin.meterNumber}
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate">{activePin.customerName}</h4>
              </div>
              <button
                onClick={() => setActivePin(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Feeder Line</span>
                <span className="font-medium text-slate-800 truncate block">{activePin.feederName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Transformer (DT)</span>
                <span className="font-mono text-slate-800 truncate block">{activePin.dtCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Phase / Voltage</span>
                <span className="font-medium text-slate-800 truncate block">{activePin.phaseType.split('(')[0]}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Pole / Upriser</span>
                <span className="font-mono text-slate-800 truncate block">{activePin.poleNumber} · {activePin.upriser.split('(')[0]}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase">GPS Coordinates</span>
                <span className="font-mono text-emerald-700 text-xs font-semibold">
                  {activePin.latitude}° N, {activePin.longitude}° E
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Captured: {activePin.date}</span>
              <button
                onClick={() => onSelectRecord(activePin)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                View Full Card
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-xs border border-slate-800 p-2.5 rounded-md text-xs text-slate-300 pointer-events-none">
          <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Legend</div>
          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Three Phase Whole Current</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Smart AMI Meter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>Single Phase Prepaid STS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
