import { MeterRecord } from '../types/meter';

const LAST_SYNC_KEY = 'voltgrid_last_sync_timestamp_v1';
const REMOTE_ENDPOINT_KEY = 'voltgrid_remote_sync_endpoint_v1';

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

export function setLastSyncTime(timestamp: string): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  } catch (err) {
    console.error('Failed to save last sync time:', err);
  }
}

export function getCustomSyncEndpoint(): string {
  try {
    return localStorage.getItem(REMOTE_ENDPOINT_KEY) || '/api/sync';
  } catch {
    return '/api/sync';
  }
}

export function setCustomSyncEndpoint(endpoint: string): void {
  try {
    localStorage.setItem(REMOTE_ENDPOINT_KEY, endpoint);
  } catch (err) {
    console.error('Failed to set remote endpoint:', err);
  }
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
  timestamp: string;
}

/**
 * Pushes local meter records to the remote utility endpoint.
 */
export async function pushRecordsToRemote(
  records: MeterRecord[],
  endpointUrl = '/api/sync'
): Promise<SyncResult> {
  const timestamp = new Date().toISOString();

  // If browser reports strictly offline, immediately report without hanging
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      syncedCount: 0,
      message: 'Cannot sync: Device is currently offline. Please reconnect to the network.',
      timestamp,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records,
        syncedAt: timestamp,
        clientVersion: '1.2.0',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    setLastSyncTime(timestamp);

    return {
      success: true,
      syncedCount: data.syncedCount ?? records.length,
      message: data.message || `Successfully pushed ${records.length} records to remote endpoint.`,
      timestamp,
    };
  } catch (err: unknown) {
    // If local endpoint fails or is in a pure client environment, handle gracefully
    const errorMsg = err instanceof Error ? err.message : 'Network sync failed';
    return {
      success: false,
      syncedCount: 0,
      message: errorMsg.includes('abort')
        ? 'Sync timed out. Remote endpoint did not respond.'
        : `Sync error: ${errorMsg}`,
      timestamp,
    };
  }
}

/**
 * Checks server reachability
 */
export async function checkServerReachability(healthUrl = '/api/health'): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}
