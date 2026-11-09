import { MeterRecord } from '../types/meter';
import {
  X,
  Printer,
  Edit2,
  MapPin,
  Zap,
  User,
  ShieldCheck,
  Calendar,
  Phone,
  Hash,
  Activity,
  Layers,
  CheckCircle,
  Camera,
  Maximize2,
} from 'lucide-react';
import { useState } from 'react';

interface MeterDetailModalProps {
  record: MeterRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: MeterRecord) => void;
}

export function MeterDetailModal({ record, isOpen, onClose, onEdit }: MeterDetailModalProps) {
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Controls Bar (Hidden during Print) */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-emerald-700 uppercase tracking-wider">
              Record ID: {record.id}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Official Utility Technical Sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
              title="Print Commissioning Certificate"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Certificate
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Record
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate / Job Sheet Content (Printable) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0">
          {/* Official Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold tracking-tight text-xl">
                <Zap className="w-6 h-6 fill-current" />
                <span>VOLTGRID UTILITY SERVICES</span>
              </div>
              <p className="text-xs text-slate-600 uppercase font-semibold tracking-wider mt-0.5">
                Electricity Meter Field Commissioning & GIS Asset Certificate
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Regional Distribution Network Directorate · Technical Audit Standard
              </p>
            </div>
            <div className="text-left sm:text-right font-mono text-xs space-y-0.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase">Certificate Sequence</div>
              <div className="text-sm font-bold text-slate-900">SN: {record.sn}</div>
              <div className="text-emerald-700 font-semibold">DATE: {record.date}</div>
              <div className="text-[10px] text-slate-400">REGIONAL CODE: {record.regionalCodeNumber}</div>
            </div>
          </div>

          {/* Primary Badge Strip with Embedded Meter Photo Thumbnail */}
          <div className="flex flex-col lg:flex-row items-stretch gap-4">
            {/* 4 Metric Boxes */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Meter Number</span>
                <span className="font-mono text-sm font-bold text-slate-900">{record.meterNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Account Number</span>
                <span className="font-mono text-sm font-bold text-slate-900">{record.accountNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Meter & Phase Type</span>
                <span className="text-xs font-semibold text-slate-900">{record.meterType}</span>
                <span className="block text-[11px] text-slate-600 truncate">{record.phaseType.split('(')[0]}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Tariff & Voltage</span>
                <span className="text-xs font-semibold text-slate-900">{record.tariff.split('(')[0]}</span>
                <span className="block text-[11px] text-slate-600">{record.voltageType.split('(')[0]}</span>
              </div>
            </div>

            {/* Meter Photo Thumbnail Block */}
            {record.meterPhoto ? (
              <div className="w-full lg:w-44 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col items-center justify-between shrink-0 text-center">
                <div
                  onClick={() => setIsPhotoExpanded(true)}
                  className="relative group cursor-pointer w-full h-24 rounded bg-black/10 overflow-hidden flex items-center justify-center border border-slate-300"
                  title="Click to view full photo"
                >
                  <img
                    src={record.meterPhoto}
                    alt={`Installed Meter #${record.meterNumber}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-mono gap-1">
                    <Maximize2 className="w-3.5 h-3.5" />
                    Enlarge
                  </div>
                </div>
                <div className="mt-1 text-[10px] font-mono font-semibold text-slate-700 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-emerald-600" />
                  <span>Verified Photo</span>
                </div>
              </div>
            ) : (
              <div className="w-full lg:w-36 bg-slate-50/60 p-2.5 rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center shrink-0 text-center text-slate-400">
                <Camera className="w-5 h-5 text-slate-300 mb-1" />
                <span className="text-[10px] font-mono">No Photo Attached</span>
              </div>
            )}
          </div>

          {/* Full Lightbox Modal when clicked */}
          {isPhotoExpanded && record.meterPhoto && (
            <div
              onClick={() => setIsPhotoExpanded(false)}
              className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 no-print"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 rounded-xl overflow-hidden max-w-2xl w-full border border-slate-700 shadow-2xl"
              >
                <div className="p-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-semibold">
                      Meter Installation Visual Record · #{record.meterNumber}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPhotoExpanded(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 flex items-center justify-center bg-black">
                  <img
                    src={record.meterPhoto}
                    alt={`Installed Meter #${record.meterNumber}`}
                    className="max-h-[70vh] w-auto object-contain rounded"
                  />
                </div>
                <div className="p-3 bg-slate-950 text-slate-300 text-xs flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400">
                    Customer: {record.customerName} · Date: {record.date}
                  </span>
                  <button
                    onClick={() => setIsPhotoExpanded(false)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customer Details Box */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-1 border-b border-slate-200">
              <User className="w-4 h-4 text-emerald-600" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-slate-500 text-[11px]">Customer Full Name:</span>
                <span className="font-bold text-slate-900 text-sm">{record.customerName}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[11px]">Contact Telephone:</span>
                <span className="font-medium text-slate-800">{record.phoneNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[11px]">Regional Code:</span>
                <span className="font-mono font-medium text-slate-800">{record.regionalCodeNumber}</span>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="block text-slate-500 text-[11px]">Installation Address:</span>
                <span className="font-medium text-slate-800">{record.customerAddress}</span>
              </div>
            </div>
          </div>

          {/* Grid Infrastructure & Network Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-1 border-b border-slate-200">
              <Activity className="w-4 h-4 text-emerald-600" />
              Grid Infrastructure & Feeder Hierarchy
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50/70 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="block text-slate-500 text-[10px] uppercase">Region</span>
                <span className="font-bold text-slate-800">{record.region}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase">Feeder Name</span>
                <span className="font-medium text-slate-800">{record.feederName}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase">Source Substation</span>
                <span className="font-medium text-slate-800">{record.source}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase">Source Type</span>
                <span className="font-medium text-slate-800">{record.sourceType}</span>
              </div>

              <div>
                <span className="block text-slate-500 text-[10px] uppercase">Transformer (DT) Name</span>
                <span className="font-medium text-slate-800">{record.dtName}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase">DT Code</span>
                <span className="font-mono font-bold text-slate-900">{record.dtCode}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase">Pole Number</span>
                <span className="font-mono font-bold text-slate-900">{record.poleNumber}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase">Upriser</span>
                <span className="font-medium text-slate-800">{record.upriser}</span>
              </div>
            </div>
          </div>

          {/* Geospatial & Coordinates */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-1 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Geospatial Coordinates & Field Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 font-mono">
                <span className="block text-[10px] font-sans font-semibold text-emerald-800 uppercase">Latitude</span>
                <span className="text-base font-bold text-emerald-900">{record.latitude}° N</span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 font-mono">
                <span className="block text-[10px] font-sans font-semibold text-emerald-800 uppercase">Longitude</span>
                <span className="text-base font-bold text-emerald-900">{record.longitude}° E</span>
              </div>
            </div>
          </div>

          {/* Field Personnel & Commissioning Sign-off */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-1 border-b border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Technical Audit & Field Personnel Sign-off
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 border border-slate-200 rounded-lg">
                <span className="block text-slate-500 text-[10px] uppercase">Installer ID & Name</span>
                <span className="font-bold text-slate-900 block mt-0.5">{record.installerName}</span>
                <span className="font-mono text-slate-600 text-[11px] block">{record.installerId}</span>
                <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
                  Installer Signature / Stamp
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-lg">
                <span className="block text-slate-500 text-[10px] uppercase">Capturing Officer</span>
                <span className="font-bold text-slate-900 block mt-0.5">{record.capturingOfficer}</span>
                <span className="text-slate-600 text-[11px] block">Field Verification Officer</span>
                <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
                  Officer Verification Stamp
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-lg">
                <span className="block text-slate-500 text-[10px] uppercase">Commissioning Date</span>
                <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">{record.date}</span>
                <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3.5 h-3.5 inline" /> Verified Active
                </span>
                <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
                  Customer Acceptance Mark
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {record.remark && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                Field Inspection Remark:
              </span>
              <p className="text-slate-800">{record.remark}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
