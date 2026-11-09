import { useState, useEffect } from 'react';
import {
  MeterRecord,
  FeederMapping,
  DtEntry,
  REGIONS,
  METER_TYPES,
  PHASE_TYPES,
  VOLTAGE_TYPES,
  TARIFF_CLASSES,
  UPISER_OPTIONS,
  SOURCE_TYPES,
} from '../types/meter';
import { MeterPhotoCapture } from './MeterPhotoCapture';
import {
  X,
  MapPin,
  Compass,
  CheckCircle2,
  Sparkles,
  Barcode,
  AlertCircle,
  Zap,
  User,
  GitBranch,
  ShieldCheck,
  Building2,
  Layers,
  Check,
  Camera,
} from 'lucide-react';

interface CaptureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: MeterRecord) => void;
  initialData?: MeterRecord | null;
  suggestedSn: string;
  feeders: FeederMapping[];
  defaultFeederName?: string;
  defaultDtCode?: string;
}

export function CaptureFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  suggestedSn,
  feeders,
  defaultFeederName,
  defaultDtCode,
}: CaptureFormModalProps) {
  const [formData, setFormData] = useState<Omit<MeterRecord, 'id' | 'createdAt'>>({
    sn: suggestedSn,
    latitude: '',
    longitude: '',
    customerName: '',
    regionalCodeNumber: 'RC-BCH-01',
    accountNumber: '',
    meterNumber: '',
    meterType: 'Prepaid STS',
    phaseType: 'Single Phase (1-Ph 2-Wire)',
    customerAddress: '',
    phoneNumber: '',
    tariff: 'R2 - Residential Single/Three Phase',
    region: 'Bauchi',
    feederName: '',
    voltageType: 'Low Voltage 230V (Single Phase)',
    dtName: '',
    dtCode: '',
    poleNumber: 'P-01',
    upriser: 'Upriser 1 (Red Phase)',
    source: '',
    sourceType: '33/11kV Injection Substation',
    installerId: 'INS-4088',
    installerName: '',
    capturingOfficer: 'Field Officer',
    remark: '',
    date: new Date().toISOString().split('T')[0],
    meterPhoto: '',
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCustomFeeder, setIsCustomFeeder] = useState(false);
  const [isCustomDt, setIsCustomDt] = useState(false);

  // Active Feeder & Associated DTs
  const currentFeederObj = feeders.find(
    (f) => f.feederName.toLowerCase() === formData.feederName.trim().toLowerCase()
  );
  const availableDts: DtEntry[] = currentFeederObj ? currentFeederObj.dts : [];

  useEffect(() => {
    if (initialData) {
      setFormData({
        sn: initialData.sn || suggestedSn,
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
        customerName: initialData.customerName || '',
        regionalCodeNumber: initialData.regionalCodeNumber || 'RC-IKJ-01',
        accountNumber: initialData.accountNumber || '',
        meterNumber: initialData.meterNumber || '',
        meterType: initialData.meterType || 'Prepaid STS',
        phaseType: initialData.phaseType || 'Single Phase (1-Ph 2-Wire)',
        customerAddress: initialData.customerAddress || '',
        phoneNumber: initialData.phoneNumber || '',
        tariff: initialData.tariff || 'R2 - Residential Single/Three Phase',
        region: initialData.region || 'Ikeja',
        feederName: initialData.feederName || '',
        voltageType: initialData.voltageType || 'Low Voltage 230V (Single Phase)',
        dtName: initialData.dtName || '',
        dtCode: initialData.dtCode || '',
        poleNumber: initialData.poleNumber || '',
        upriser: initialData.upriser || 'Upriser 1 (Red Phase)',
        source: initialData.source || '',
        sourceType: initialData.sourceType || '33/11kV Injection Substation',
        installerId: initialData.installerId || '',
        installerName: initialData.installerName || '',
        capturingOfficer: initialData.capturingOfficer || '',
        remark: initialData.remark || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        meterPhoto: initialData.meterPhoto || '',
      });
      setIsCustomFeeder(false);
      setIsCustomDt(false);
    } else {
      // Default initial feeder from props or first loaded feeder
      const initialFeeder = defaultFeederName || (feeders.length > 0 ? feeders[0].feederName : '');
      const feederMatch = feeders.find((f) => f.feederName === initialFeeder);
      const initialDt = defaultDtCode && feederMatch
        ? feederMatch.dts.find((d) => d.dtCode === defaultDtCode) || feederMatch.dts[0]
        : feederMatch?.dts[0];

      setFormData((prev) => ({
        ...prev,
        sn: suggestedSn,
        feederName: initialFeeder,
        region: feederMatch?.region || prev.region || 'Ikeja',
        source: feederMatch?.source || prev.source || '',
        sourceType: feederMatch?.sourceType || prev.sourceType || '33/11kV Injection Substation',
        dtName: initialDt?.dtName || '',
        dtCode: initialDt?.dtCode || '',
        meterPhoto: '',
        date: new Date().toISOString().split('T')[0],
      }));
      setIsCustomFeeder(false);
      setIsCustomDt(false);
    }
    setFormErrors({});
    setGpsStatus(null);
  }, [initialData, suggestedSn, isOpen, defaultFeederName, defaultDtCode, feeders]);

  if (!isOpen) return null;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  /**
   * Handle Feeder Selection:
   * When user selects a Feeder from the dropdown,
   * look up its DTs and automatically populate DT Name, DT Code, Region, Source.
   */
  const handleFeederSelect = (selectedFeederName: string) => {
    if (selectedFeederName === '__CUSTOM__') {
      setIsCustomFeeder(true);
      handleChange('feederName', '');
      setIsCustomDt(true);
      return;
    }

    setIsCustomFeeder(false);
    const feederMatch = feeders.find((f) => f.feederName === selectedFeederName);

    if (feederMatch) {
      const firstDt = feederMatch.dts.length > 0 ? feederMatch.dts[0] : null;
      setFormData((prev) => ({
        ...prev,
        feederName: feederMatch.feederName,
        region: feederMatch.region || prev.region,
        source: feederMatch.source || prev.source,
        sourceType: feederMatch.sourceType || prev.sourceType,
        dtName: firstDt ? firstDt.dtName : '',
        dtCode: firstDt ? firstDt.dtCode : '',
      }));
      setIsCustomDt(feederMatch.dts.length === 0);
    } else {
      handleChange('feederName', selectedFeederName);
    }
  };

  /**
   * Handle DT Selection:
   * When user selects a DT from the feeder list,
   * instantly populate both DT Name AND DT Code!
   */
  const handleDtSelect = (selectedDtCode: string) => {
    if (selectedDtCode === '__CUSTOM__') {
      setIsCustomDt(true);
      return;
    }

    setIsCustomDt(false);
    const dtMatch = availableDts.find((d) => d.dtCode === selectedDtCode);
    if (dtMatch) {
      setFormData((prev) => ({
        ...prev,
        dtName: dtMatch.dtName,
        dtCode: dtMatch.dtCode,
      }));
    }
  };

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by browser.');
      return;
    }

    setGpsLoading(true);
    setGpsStatus('Acquiring high-accuracy satellite lock...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const acc = position.coords.accuracy ? Math.round(position.coords.accuracy) : null;
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setGpsLoading(false);
        setGpsStatus(`GPS Coordinates captured (±${acc ?? 5}m accuracy).`);
      },
      (error) => {
        setGpsLoading(false);
        setGpsStatus(`GPS acquisition error: ${error.message}. You can enter coordinates manually.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleFillDemoData = () => {
    const demoMeter = '04' + Math.floor(100000000 + Math.random() * 900000000);
    const demoAcc = '08/' + Math.floor(10 + Math.random() * 90) + '/' + Math.floor(10 + Math.random() * 90) + '/' + Math.floor(1000 + Math.random() * 9000) + '-01';
    
    // Pick first available feeder (or GWALLAMEJI) and DT
    const fObj = feeders.find(f => f.feederName === 'GWALLAMEJI') || feeders[0];
    const dtObj = fObj?.dts[0];

    setFormData({
      sn: suggestedSn,
      latitude: (10.3158 + (Math.random() - 0.5) * 0.04).toFixed(6),
      longitude: (9.8442 + (Math.random() - 0.5) * 0.04).toFixed(6),
      customerName: 'Alhaji Bello Abubakar Commercial Plaza',
      regionalCodeNumber: 'RC-BCH-014',
      accountNumber: demoAcc,
      meterNumber: demoMeter,
      meterType: 'Smart AMI (Cellular)',
      phaseType: 'Three Phase (3-Ph 4-Wire Whole Current)',
      customerAddress: 'Plot 18, Commercial Strip, Gwallameji, Bauchi',
      phoneNumber: '+234 803 445 1192',
      tariff: 'Band A (Non-MD 20+ hrs)',
      region: fObj?.region || 'Bauchi',
      feederName: fObj ? fObj.feederName : 'GWALLAMEJI',
      voltageType: 'Low Voltage 400V (Three Phase)',
      dtName: dtObj ? dtObj.dtName : 'DT 500kVA Gwallameji Market Square',
      dtCode: dtObj ? dtObj.dtCode : 'DT-BCH-GW-001',
      poleNumber: 'P-GW/12',
      upriser: 'Upriser 1 (Red Phase)',
      source: fObj?.source || 'Yelwa 33/11kV Injection Substation',
      sourceType: fObj?.sourceType || '33/11kV Injection Substation',
      installerId: 'INS-4088',
      installerName: 'Engr. Kenneth Nwachukwu',
      capturingOfficer: 'Field Officer Fatima Sanusi (OFF-301)',
      remark: 'New smart installation. Tamper seal #TS-9921 intact. Keypad communication link confirmed active.',
      date: new Date().toISOString().split('T')[0],
      meterPhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231e293b"/><rect x="50" y="30" width="300" height="240" rx="16" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="4"/><rect x="80" y="60" width="240" height="60" rx="6" fill="%23022c22"/><text x="300" y="102" font-family="monospace" font-size="24" font-weight="bold" fill="%2334d399" text-anchor="end">4192.8 kWh</text><text x="90" y="80" font-family="monospace" font-size="10" fill="%236ee7b7">NORMAL · 50Hz</text><text x="80" y="150" font-family="sans-serif" font-size="12" font-weight="bold" fill="%230f172a">MTR: ' + demoMeter + '</text><text x="80" y="168" font-family="sans-serif" font-size="10" fill="%2364748b">VOLTGRID THREE-PHASE AMI</text><rect x="80" y="185" width="240" height="25" fill="%23334155"/><rect x="80" y="225" width="120" height="25" rx="4" fill="%23dc2626"/><text x="140" y="241" font-family="monospace" font-size="9" font-weight="bold" fill="%23ffffff" text-anchor="middle">SEAL #TK-9921</text></svg>',
    });
    setGpsStatus('Realistic utility field sample loaded.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.sn.trim()) errors.sn = 'SN is required.';
    if (!formData.customerName.trim()) errors.customerName = 'Customer Name is required.';
    if (!formData.meterNumber.trim()) errors.meterNumber = 'Meter Number is required.';
    if (!formData.accountNumber.trim()) errors.accountNumber = 'Account Number is required.';
    if (!formData.feederName.trim()) errors.feederName = 'Feeder Name is required.';
    if (!formData.dtCode.trim()) errors.dtCode = 'DT Code is required.';
    if (!formData.poleNumber.trim()) errors.poleNumber = 'Pole Number is required.';
    if (!formData.installerName.trim()) errors.installerName = 'Installer Name is required.';
    if (!formData.capturingOfficer.trim()) errors.capturingOfficer = 'Capturing Officer is required.';
    if (!formData.latitude.trim() || isNaN(parseFloat(formData.latitude))) {
      errors.latitude = 'Valid latitude coordinate is required.';
    }
    if (!formData.longitude.trim() || isNaN(parseFloat(formData.longitude))) {
      errors.longitude = 'Valid longitude coordinate is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newRecord: MeterRecord = {
      id: initialData?.id || 'rec-' + Date.now(),
      ...formData,
      createdAt: initialData?.createdAt || Date.now(),
    };

    onSave(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {initialData ? 'Edit Meter Field Record' : 'Capture New Electricity Meter'}
              </h2>
              <p className="text-xs text-slate-500">
                Official DISCO Commissioning & Spatial Asset Technical Entry
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!initialData && (
              <button
                type="button"
                onClick={handleFillDemoData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                title="Populate test data for quick inspection"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Fill Sample Data
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {Object.keys(formErrors).length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-semibold">Please complete all required fields:</span>
                <span className="ml-1">
                  {Object.values(formErrors).slice(0, 3).join(' ')}
                </span>
              </div>
            </div>
          )}

          {/* Section 1: Meter & Electrical Specification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>1. Meter & Electrical Specification</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  SN (Sequence / Serial) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sn}
                  onChange={(e) => handleChange('sn', e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-md border ${
                    formErrors.sn ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  placeholder="e.g. 007"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Meter Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.meterNumber}
                    onChange={(e) => handleChange('meterNumber', e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-md border pr-8 ${
                      formErrors.meterNumber ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                    } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                    placeholder="e.g. 02194881729"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const gen = '04' + Math.floor(100000000 + Math.random() * 900000000);
                      handleChange('meterNumber', gen);
                    }}
                    title="Generate Meter Number"
                    className="absolute right-2 top-2 text-slate-400 hover:text-emerald-600"
                  >
                    <Barcode className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Meter Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.meterType}
                  onChange={(e) => handleChange('meterType', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {METER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phase Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.phaseType}
                  onChange={(e) => handleChange('phaseType', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {PHASE_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Voltage Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.voltageType}
                  onChange={(e) => handleChange('voltageType', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {VOLTAGE_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tariff Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tariff}
                  onChange={(e) => handleChange('tariff', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {TARIFF_CLASSES.map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Customer Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              <User className="w-4 h-4 text-emerald-600" />
              <span>2. Customer Account Information</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-md border ${
                    formErrors.customerName ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  placeholder="e.g. Chief Adebayo Adeleke"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Regional Code Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.regionalCodeNumber}
                  onChange={(e) => handleChange('regionalCodeNumber', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. RC-IKJ-044"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-md border ${
                    formErrors.accountNumber ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  placeholder="e.g. 01/18/42/9902-01"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. +234 803 445 1192"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerAddress}
                  onChange={(e) => handleChange('customerAddress', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Plot 14, Commercial Avenue, Ikeja Industrial Estate, Lagos"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Grid & Infrastructure Hierarchy (FEEDER SELECTION & DYNAMIC DT AUTO-FILL) */}
          <div className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <GitBranch className="w-4 h-4 text-emerald-600" />
                <span>3. Grid Hierarchy · Feeder & Distribution Transformer</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Dynamic DT Auto-Fill Active
              </span>
            </div>

            {/* FEEDER SELECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Feeder Name (Selection from File / Catalog) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomFeeder(!isCustomFeeder);
                      if (!isCustomFeeder) setIsCustomDt(true);
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    {isCustomFeeder ? '← Pick from Uploaded Feeders' : '+ Type Custom Feeder'}
                  </button>
                </div>

                {!isCustomFeeder ? (
                  <select
                    value={formData.feederName}
                    onChange={(e) => handleFeederSelect(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-medium rounded-md border ${
                      formErrors.feederName ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                    } bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  >
                    <option value="">-- Select Feeder from File / Directory --</option>
                    {feeders.map((f) => (
                      <option key={f.feederName} value={f.feederName}>
                        {f.feederName} ({f.dts.length} DTs) {f.region ? `· ${f.region}` : ''}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Enter Unlisted Feeder...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.feederName}
                    onChange={(e) => handleChange('feederName', e.target.value)}
                    placeholder="Enter Custom Feeder Name (e.g. 11kV Spur Feeder)"
                    className={`w-full px-3 py-2 text-xs rounded-md border ${
                      formErrors.feederName ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                    } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  />
                )}
                {currentFeederObj && (
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Feeder linked: {availableDts.length} Distribution Transformers available in catalog.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Region <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DYNAMIC DT SELECTION (Auto-fills DT Name and DT Code) */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Distribution Transformer (DT) Link
                  </span>
                  <span className="text-[11px] text-slate-500">
                    — Selecting a DT automatically populates Name & Code from file
                  </span>
                </div>

                {availableDts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomDt(!isCustomDt)}
                    className="text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    {isCustomDt ? '← Select from Feeder DTs' : '+ Manual DT entry'}
                  </button>
                )}
              </div>

              {availableDts.length > 0 && !isCustomDt ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Select Transformer on this Feeder:
                  </label>
                  <select
                    value={formData.dtCode}
                    onChange={(e) => handleDtSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-md border border-emerald-300 bg-emerald-50/40 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose DT from Selected Feeder --</option>
                    {availableDts.map((dt) => (
                      <option key={dt.dtCode} value={dt.dtCode}>
                        [{dt.dtCode}] {dt.dtName}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Enter Unlisted Transformer Code...</option>
                  </select>
                </div>
              ) : (
                availableDts.length === 0 && !isCustomDt && (
                  <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    No DTs were found for "{formData.feederName || 'selected feeder'}". You can enter DT Name and Code below or upload a Feeder file.
                  </div>
                )
              )}

              {/* Verified DT Name & DT Code Display/Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    DT Name (Transformer Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.dtName}
                    onChange={(e) => handleChange('dtName', e.target.value)}
                    placeholder="e.g. DT 500kVA Oba Akran Sub-1"
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    DT Code (Transformer Identification) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.dtCode}
                    onChange={(e) => handleChange('dtCode', e.target.value)}
                    placeholder="e.g. DT-IKJ-OA-012"
                    className={`w-full px-3 py-2 text-xs font-mono rounded-md border ${
                      formErrors.dtCode ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                    } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  />
                </div>
              </div>
            </div>

            {/* Substation & Poles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Source Substation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Alausa 132/33kV Station"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Source Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sourceType}
                  onChange={(e) => handleChange('sourceType', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {SOURCE_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pole Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.poleNumber}
                  onChange={(e) => handleChange('poleNumber', e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-md border ${
                    formErrors.poleNumber ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  placeholder="e.g. P-OA/04"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Upriser <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.upriser}
                  onChange={(e) => handleChange('upriser', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {UPISER_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Geospatial Coordinates & GPS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>4. Geospatial Coordinates & GPS</span>
              </div>
              <button
                type="button"
                onClick={handleCaptureGps}
                disabled={gpsLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                {gpsLoading ? 'Acquiring GPS...' : 'Capture Current GPS'}
              </button>
            </div>

            {gpsStatus && (
              <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 font-mono">
                {gpsStatus}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Latitude (Decimal Degrees) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => handleChange('latitude', e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-md border ${
                    formErrors.latitude ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  placeholder="e.g. 6.601838"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Longitude (Decimal Degrees) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => handleChange('longitude', e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-md border ${
                    formErrors.longitude ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  placeholder="e.g. 3.351486"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Personnel, Audit & Certification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>5. Personnel, Audit & Commissioning</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Installer ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.installerId}
                  onChange={(e) => handleChange('installerId', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. INS-4088"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Installer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.installerName}
                  onChange={(e) => handleChange('installerName', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-md border ${
                    formErrors.installerName ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  placeholder="e.g. Kenneth Nwachukwu"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Capturing Officer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.capturingOfficer}
                  onChange={(e) => handleChange('capturingOfficer', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-md border ${
                    formErrors.capturingOfficer ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
                  } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                  placeholder="e.g. Fatima Sanusi (OFF-301)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Remark / Technical Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.remark}
                  onChange={(e) => handleChange('remark', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Meter commissioned, anti-tamper seal #TK-9921 applied, neutral load verified."
                />
              </div>
            </div>
          </div>

          {/* Section 6: Meter Installation Photo & Optical Seal Inspection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>6. Meter Installation Photo & Optical Seal Inspection</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Camera / Photo Attachment
              </span>
            </div>

            <MeterPhotoCapture
              value={formData.meterPhoto}
              onChange={(photo) => handleChange('meterPhoto', photo)}
              onRemove={() => handleChange('meterPhoto', '')}
              meterNumber={formData.meterNumber}
              customerName={formData.customerName}
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {initialData ? 'Update Meter Record' : 'Save & Commission Meter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
