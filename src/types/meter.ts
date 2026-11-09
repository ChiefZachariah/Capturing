export interface MeterRecord {
  id: string; // Internal unique ID
  sn: string; // SN (Serial Number / Sequence)
  latitude: string; // Latitude (e.g. 6.524379)
  longitude: string; // Longitude (e.g. 3.379206)
  customerName: string; // Customer Name
  regionalCodeNumber: string; // Regional Code Number
  accountNumber: string; // Account Number
  meterNumber: string; // Meter Number
  meterType: string; // Meter Type (Prepaid, Postpaid, Smart AMI, MD)
  phaseType: string; // Phase Type (Single Phase, Three Phase)
  customerAddress: string; // Customer Address
  phoneNumber: string; // Phone Number
  tariff: string; // Tariff (e.g. R2, C1, D1, Band A)
  region: string; // Region (e.g. Ikeja, Eko, Abuja)
  feederName: string; // Feeder Name
  voltageType: string; // Voltage Type (LV 230V, LV 400V, MV 11kV)
  dtName: string; // DT Name (Distribution Transformer Name)
  dtCode: string; // DT Code
  poleNumber: string; // Pole Number
  upriser: string; // Upriser (e.g. Upriser 1, Upriser 2)
  source: string; // Source (Substation name)
  sourceType: string; // Source Type (e.g. 33/11kV Injection Substation)
  installerId: string; // Installer ID
  installerName: string; // Installer Name
  capturingOfficer: string; // Capturing Officer
  remark: string; // Remark
  date: string; // Date (YYYY-MM-DD or formatted)
  meterPhoto?: string; // Base64 data URL or photo URL of installed meter
  createdAt?: number;
}

export const REGIONS = [
  'Bauchi',
  'Ikeja',
  'Eko',
  'Abuja',
  'Ibadan',
  'Enugu',
  'Benin',
  'Port Harcourt',
  'Kaduna',
  'Kano',
  'Jos',
  'Yola',
] as const;

export const METER_TYPES = [
  'Prepaid STS',
  'Smart AMI (Cellular)',
  'Smart AMI (PLC/RF)',
  'Postpaid Analog',
  'Maximum Demand (MD LV)',
  'Maximum Demand (MD HV)',
] as const;

export const PHASE_TYPES = [
  'Single Phase (1-Ph 2-Wire)',
  'Three Phase (3-Ph 4-Wire Whole Current)',
  'Three Phase CT-Operated (MD)',
  'Direct Connected',
] as const;

export const VOLTAGE_TYPES = [
  'Low Voltage 230V (Single Phase)',
  'Low Voltage 400V (Three Phase)',
  'Medium Voltage 11kV',
  'High Voltage 33kV',
] as const;

export const TARIFF_CLASSES = [
  'Band A (Non-MD 20+ hrs)',
  'Band A (MD 20+ hrs)',
  'Band B (Non-MD 16-20 hrs)',
  'Band B (MD 16-20 hrs)',
  'Band C (Non-MD 12-16 hrs)',
  'R2 - Residential Single/Three Phase',
  'C1 - Commercial Small Business',
  'D1 - Industrial Commercial',
  'LifeLine (<50kWh)',
] as const;

export const UPISER_OPTIONS = [
  'Upriser 1 (Red Phase)',
  'Upriser 2 (Yellow Phase)',
  'Upriser 3 (Blue Phase)',
  'Upriser 4 (Auxiliary)',
  'Overhead Feeder Direct',
  'Underground Cable Trench',
] as const;

export const SOURCE_TYPES = [
  '33/11kV Injection Substation',
  '132/33kV Transmission Substation',
  'Primary Switching Station',
  'Solar Hybrid Mini-Grid Plant',
  'Captive Power Facility',
] as const;

export interface DtEntry {
  dtName: string;
  dtCode: string;
}

export interface FeederMapping {
  feederName: string;
  region?: string;
  source?: string;
  sourceType?: string;
  dts: DtEntry[];
}

export const CSV_COLUMNS: { key: keyof MeterRecord; label: string }[] = [
  { key: 'sn', label: 'SN' },
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'regionalCodeNumber', label: 'Regional Code Number' },
  { key: 'accountNumber', label: 'Account Number' },
  { key: 'meterNumber', label: 'Meter Number' },
  { key: 'meterType', label: 'Meter Type' },
  { key: 'phaseType', label: 'Phase Type' },
  { key: 'customerAddress', label: 'Customer Address' },
  { key: 'phoneNumber', label: 'Phone Number' },
  { key: 'tariff', label: 'Tariff' },
  { key: 'region', label: 'Region' },
  { key: 'feederName', label: 'Feeder Name' },
  { key: 'voltageType', label: 'Voltage Type' },
  { key: 'dtName', label: 'DT Name' },
  { key: 'dtCode', label: 'DT Code' },
  { key: 'poleNumber', label: 'Pole Number' },
  { key: 'upriser', label: 'Upriser' },
  { key: 'source', label: 'Source' },
  { key: 'sourceType', label: 'Source Type' },
  { key: 'installerId', label: 'Installer ID' },
  { key: 'installerName', label: 'Installer Name' },
  { key: 'capturingOfficer', label: 'Capturing Officer' },
  { key: 'remark', label: 'Remark' },
  { key: 'date', label: 'Date' },
];

