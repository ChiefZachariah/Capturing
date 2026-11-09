import { CSV_COLUMNS, MeterRecord } from '../types/meter';
import { INITIAL_METER_RECORDS } from '../data/mockData';

const STORAGE_KEY = 'voltgrid_meter_captures_v1';

export function getStoredRecords(): MeterRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_METER_RECORDS));
      return INITIAL_METER_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_METER_RECORDS;
  } catch (err) {
    console.error('Failed to load meter records from localStorage:', err);
    return INITIAL_METER_RECORDS;
  }
}

export function saveStoredRecords(records: MeterRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save meter records to localStorage:', err);
  }
}

export function resetToDefaultRecords(): MeterRecord[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_METER_RECORDS));
    return INITIAL_METER_RECORDS;
  } catch (err) {
    console.error('Failed to reset records:', err);
    return INITIAL_METER_RECORDS;
  }
}

export function generateNextSn(records: MeterRecord[]): string {
  if (records.length === 0) return '001';
  const numericSns = records
    .map((r) => parseInt(r.sn.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n));
  
  if (numericSns.length === 0) {
    return String(records.length + 1).padStart(3, '0');
  }
  const max = Math.max(...numericSns);
  return String(max + 1).padStart(3, '0');
}

/**
 * Exports records to CSV using the exact 26 column headers requested:
 * "SN, Latitude, Longitude, Customer Name, Regional Code Number, Account Number, Meter Number, Meter Type, Phase Type, Customer Address, Phone Number, Tariff, Region, Feeder Name, Voltage Type, DT Name, DT Code, Pole Number, Upriser, Source, Source Type, Installer ID, Installer Name, Capturing Officer, Remark, Date"
 */
export function exportRecordsToCsv(records: MeterRecord[], filename = 'meter_captures_export.csv'): void {
  const headers = CSV_COLUMNS.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  
  const rows = records.map((record) => {
    return CSV_COLUMNS.map((col) => {
      const val = record[col.key] ?? '';
      const cleanVal = String(val).replace(/"/g, '""');
      return `"${cleanVal}"`;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports records to JSON
 */
export function exportRecordsToJson(records: MeterRecord[], filename = 'meter_captures.json'): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Basic CSV Parser to support importing external capture data
 */
export function parseCsvToRecords(csvText: string): { success: boolean; records: MeterRecord[]; error?: string } {
  try {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return { success: false, records: [], error: 'CSV file is empty or missing headers.' };
    }

    // Parse CSV line handling quotes
    const parseLine = (text: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          if (inQuotes && text[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headerRow = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Map each expected column to its index
    const columnMap: Record<keyof MeterRecord, number> = {
      id: -1,
      sn: headerRow.findIndex((h) => h === 'sn' || h.includes('serial')),
      latitude: headerRow.findIndex((h) => h.includes('lat')),
      longitude: headerRow.findIndex((h) => h.includes('lon') || h.includes('lng')),
      customerName: headerRow.findIndex((h) => h.includes('customername') || h === 'name' || h.includes('client')),
      regionalCodeNumber: headerRow.findIndex((h) => h.includes('regionalcode') || h.includes('regioncode')),
      accountNumber: headerRow.findIndex((h) => h.includes('account')),
      meterNumber: headerRow.findIndex((h) => h.includes('meternumber') || h.includes('meter') || h.includes('meterno')),
      meterType: headerRow.findIndex((h) => h.includes('metertype')),
      phaseType: headerRow.findIndex((h) => h.includes('phasetype') || h.includes('phase')),
      customerAddress: headerRow.findIndex((h) => h.includes('address')),
      phoneNumber: headerRow.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('contact')),
      tariff: headerRow.findIndex((h) => h.includes('tariff')),
      region: headerRow.findIndex((h) => h.includes('region') && !h.includes('code')),
      feederName: headerRow.findIndex((h) => h.includes('feeder')),
      voltageType: headerRow.findIndex((h) => h.includes('voltage')),
      dtName: headerRow.findIndex((h) => (h.includes('dtname') || h.includes('transformer')) && !h.includes('code')),
      dtCode: headerRow.findIndex((h) => h.includes('dtcode') || h.includes('transformercode')),
      poleNumber: headerRow.findIndex((h) => h.includes('pole')),
      upriser: headerRow.findIndex((h) => h.includes('upriser')),
      source: headerRow.findIndex((h) => h === 'source' || (h.includes('source') && !h.includes('type'))),
      sourceType: headerRow.findIndex((h) => h.includes('sourcetype')),
      installerId: headerRow.findIndex((h) => h.includes('installerid')),
      installerName: headerRow.findIndex((h) => h.includes('installername') || h.includes('installer')),
      capturingOfficer: headerRow.findIndex((h) => h.includes('capturing') || h.includes('officer')),
      remark: headerRow.findIndex((h) => h.includes('remark') || h.includes('note') || h.includes('comment')),
      date: headerRow.findIndex((h) => h.includes('date')),
      meterPhoto: -1,
      createdAt: -1,
    };

    const newRecords: MeterRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length < 3) continue;

      const record: MeterRecord = {
        id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        sn: columnMap.sn >= 0 ? cols[columnMap.sn] || String(i).padStart(3, '0') : String(i).padStart(3, '0'),
        latitude: columnMap.latitude >= 0 ? cols[columnMap.latitude] || '' : '',
        longitude: columnMap.longitude >= 0 ? cols[columnMap.longitude] || '' : '',
        customerName: columnMap.customerName >= 0 ? cols[columnMap.customerName] || '' : 'Customer ' + i,
        regionalCodeNumber: columnMap.regionalCodeNumber >= 0 ? cols[columnMap.regionalCodeNumber] || '' : '',
        accountNumber: columnMap.accountNumber >= 0 ? cols[columnMap.accountNumber] || '' : '',
        meterNumber: columnMap.meterNumber >= 0 ? cols[columnMap.meterNumber] || '' : 'MTR-' + Math.floor(10000000000 + Math.random() * 90000000000),
        meterType: columnMap.meterType >= 0 ? cols[columnMap.meterType] || 'Prepaid STS' : 'Prepaid STS',
        phaseType: columnMap.phaseType >= 0 ? cols[columnMap.phaseType] || 'Single Phase (1-Ph 2-Wire)' : 'Single Phase (1-Ph 2-Wire)',
        customerAddress: columnMap.customerAddress >= 0 ? cols[columnMap.customerAddress] || '' : '',
        phoneNumber: columnMap.phoneNumber >= 0 ? cols[columnMap.phoneNumber] || '' : '',
        tariff: columnMap.tariff >= 0 ? cols[columnMap.tariff] || 'R2 - Residential' : 'R2 - Residential',
        region: columnMap.region >= 0 ? cols[columnMap.region] || 'Ikeja' : 'Ikeja',
        feederName: columnMap.feederName >= 0 ? cols[columnMap.feederName] || '' : '',
        voltageType: columnMap.voltageType >= 0 ? cols[columnMap.voltageType] || 'Low Voltage 230V' : 'Low Voltage 230V',
        dtName: columnMap.dtName >= 0 ? cols[columnMap.dtName] || '' : '',
        dtCode: columnMap.dtCode >= 0 ? cols[columnMap.dtCode] || '' : '',
        poleNumber: columnMap.poleNumber >= 0 ? cols[columnMap.poleNumber] || '' : '',
        upriser: columnMap.upriser >= 0 ? cols[columnMap.upriser] || 'Upriser 1' : 'Upriser 1',
        source: columnMap.source >= 0 ? cols[columnMap.source] || '' : '',
        sourceType: columnMap.sourceType >= 0 ? cols[columnMap.sourceType] || '33/11kV Injection Substation' : '33/11kV Injection Substation',
        installerId: columnMap.installerId >= 0 ? cols[columnMap.installerId] || '' : '',
        installerName: columnMap.installerName >= 0 ? cols[columnMap.installerName] || '' : '',
        capturingOfficer: columnMap.capturingOfficer >= 0 ? cols[columnMap.capturingOfficer] || '' : '',
        remark: columnMap.remark >= 0 ? cols[columnMap.remark] || '' : '',
        date: columnMap.date >= 0 ? cols[columnMap.date] || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        meterPhoto: '',
        createdAt: Date.now(),
      };

      newRecords.push(record);
    }

    return { success: true, records: newRecords };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown parsing error';
    return { success: false, records: [], error: errorMsg };
  }
}

/* ==========================================================================
   FEEDER & DISTRIBUTION TRANSFORMER (DT) HIERARCHY STORAGE & PARSERS
   ========================================================================== */

import { FeederMapping, DtEntry } from '../types/meter';
import { INITIAL_FEEDER_MAPPINGS } from '../data/mockData';

const FEEDERS_STORAGE_KEY = 'voltgrid_feeder_mappings_v2';

export function getStoredFeeders(): FeederMapping[] {
  try {
    const raw = localStorage.getItem(FEEDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FEEDERS_STORAGE_KEY, JSON.stringify(INITIAL_FEEDER_MAPPINGS));
      return INITIAL_FEEDER_MAPPINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_FEEDER_MAPPINGS;
  } catch (err) {
    console.error('Failed to load feeders from localStorage:', err);
    return INITIAL_FEEDER_MAPPINGS;
  }
}

export function saveStoredFeeders(feeders: FeederMapping[]): void {
  try {
    localStorage.setItem(FEEDERS_STORAGE_KEY, JSON.stringify(feeders));
  } catch (err) {
    console.error('Failed to save feeders to localStorage:', err);
  }
}

export function resetStoredFeeders(): FeederMapping[] {
  try {
    localStorage.setItem(FEEDERS_STORAGE_KEY, JSON.stringify(INITIAL_FEEDER_MAPPINGS));
    return INITIAL_FEEDER_MAPPINGS;
  } catch (err) {
    console.error('Failed to reset feeders:', err);
    return INITIAL_FEEDER_MAPPINGS;
  }
}

/**
 * Parses user-uploaded CSV containing Feeders and their DTs (Name & Code).
 * Supports standard headers:
 * Feeder Name, DT Name, DT Code, Region (optional), Source (optional), Source Type (optional)
 */
export function parseFeedersCsv(csvText: string): {
  success: boolean;
  feeders: FeederMapping[];
  totalDts: number;
  error?: string;
} {
  try {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return { success: false, feeders: [], totalDts: 0, error: 'File is empty or missing headers.' };
    }

    const parseLine = (text: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          if (inQuotes && text[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headerRow = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const feederIdx = headerRow.findIndex((h) => h.includes('feeder'));
    const dtNameIdx = headerRow.findIndex((h) => (h.includes('dtname') || h.includes('transformername') || h === 'dt' || h === 'transformer') && !h.includes('code'));
    const dtCodeIdx = headerRow.findIndex((h) => h.includes('dtcode') || h.includes('transformercode') || h === 'code');
    const regionIdx = headerRow.findIndex((h) => h.includes('region') && !h.includes('code'));
    const sourceIdx = headerRow.findIndex((h) => h === 'source' || (h.includes('source') && !h.includes('type')));
    const sourceTypeIdx = headerRow.findIndex((h) => h.includes('sourcetype'));

    if (feederIdx === -1) {
      return {
        success: false,
        feeders: [],
        totalDts: 0,
        error: 'Could not find a column for "Feeder Name" or "Feeder". Please verify headers.',
      };
    }

    if (dtNameIdx === -1 && dtCodeIdx === -1) {
      return {
        success: false,
        feeders: [],
        totalDts: 0,
        error: 'Could not find columns for "DT Name" or "DT Code". Please verify headers.',
      };
    }

    // Map by Feeder Name (case-insensitive key)
    const feederMap = new Map<string, FeederMapping>();
    let totalDts = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length <= feederIdx) continue;

      const feederName = cols[feederIdx]?.trim();
      if (!feederName) continue;

      const dtName = dtNameIdx >= 0 && cols[dtNameIdx] ? cols[dtNameIdx].trim() : '';
      const dtCode = dtCodeIdx >= 0 && cols[dtCodeIdx] ? cols[dtCodeIdx].trim() : (dtName || 'DT-' + (i));
      const region = regionIdx >= 0 && cols[regionIdx] ? cols[regionIdx].trim() : undefined;
      const source = sourceIdx >= 0 && cols[sourceIdx] ? cols[sourceIdx].trim() : undefined;
      const sourceType = sourceTypeIdx >= 0 && cols[sourceTypeIdx] ? cols[sourceTypeIdx].trim() : undefined;

      const normalizedKey = feederName.toLowerCase();
      let feederObj = feederMap.get(normalizedKey);

      if (!feederObj) {
        feederObj = {
          feederName,
          region,
          source,
          sourceType,
          dts: [],
        };
        feederMap.set(normalizedKey, feederObj);
      } else {
        if (!feederObj.region && region) feederObj.region = region;
        if (!feederObj.source && source) feederObj.source = source;
        if (!feederObj.sourceType && sourceType) feederObj.sourceType = sourceType;
      }

      if (dtName || dtCode) {
        // Prevent duplicate DT code under same feeder
        const exists = feederObj.dts.some((d) => d.dtCode.toLowerCase() === dtCode.toLowerCase());
        if (!exists) {
          feederObj.dts.push({
            dtName: dtName || `DT ${dtCode}`,
            dtCode: dtCode || `DT-${dtName.replace(/\s+/g, '-').toUpperCase()}`,
          });
          totalDts++;
        }
      }
    }

    const feeders = Array.from(feederMap.values());
    if (feeders.length === 0) {
      return { success: false, feeders: [], totalDts: 0, error: 'No valid feeder rows found.' };
    }

    return { success: true, feeders, totalDts };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown parsing error';
    return { success: false, feeders: [], totalDts: 0, error: errorMsg };
  }
}

/**
 * Downloads a sample CSV template for Feeders and DTs
 */
export function downloadFeedersCsvTemplate(): void {
  const headers = ['Feeder Name', 'DT Name', 'DT Code', 'Region', 'Source', 'Source Type'];
  const sampleRows = [
    ['GWALLAMEJI', 'DT 500kVA Gwallameji Market Square', 'DT-BCH-GW-001', 'Bauchi', 'Yelwa 33/11kV Injection Substation', '33/11kV Injection Substation'],
    ['GWALLAMEJI', 'DT 500kVA Federal Poly Main Gate', 'DT-BCH-GW-002', 'Bauchi', 'Yelwa 33/11kV Injection Substation', '33/11kV Injection Substation'],
    ['33KV TIAMIN', 'DT 1000kVA Tiamin Rice Mill Dedicated', 'DT-BCH-TM-001', 'Bauchi', 'Bauchi 132/33kV Transmission Substation', '132/33kV Transmission Substation'],
    ['ATBU', 'DT 800kVA ATBU Central Senate Building', 'DT-BCH-ATB-001', 'Bauchi', 'Bauchi Central 33/11kV Injection Substation', '33/11kV Injection Substation'],
    ['TEACHING HOSPITAL', 'DT 1000kVA ATBUTH Main Hospital Block', 'DT-BCH-TH-001', 'Bauchi', 'Yelwa 33/11kV Injection Substation', '33/11kV Injection Substation'],
  ];

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'feeders_and_dts_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports current loaded Feeders and DTs to CSV
 */
export function exportFeedersToCsv(feeders: FeederMapping[]): void {
  const headers = ['Feeder Name', 'DT Name', 'DT Code', 'Region', 'Source', 'Source Type'];
  const rows: string[] = [];

  feeders.forEach((feeder) => {
    if (feeder.dts.length === 0) {
      rows.push([
        `"${feeder.feederName.replace(/"/g, '""')}"`,
        '""',
        '""',
        `"${(feeder.region || '').replace(/"/g, '""')}"`,
        `"${(feeder.source || '').replace(/"/g, '""')}"`,
        `"${(feeder.sourceType || '').replace(/"/g, '""')}"`,
      ].join(','));
    } else {
      feeder.dts.forEach((dt) => {
        rows.push([
          `"${feeder.feederName.replace(/"/g, '""')}"`,
          `"${dt.dtName.replace(/"/g, '""')}"`,
          `"${dt.dtCode.replace(/"/g, '""')}"`,
          `"${(feeder.region || '').replace(/"/g, '""')}"`,
          `"${(feeder.source || '').replace(/"/g, '""')}"`,
          `"${(feeder.sourceType || '').replace(/"/g, '""')}"`,
        ].join(','));
      });
    }
  });

  const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'feeders_dts_hierarchy.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

