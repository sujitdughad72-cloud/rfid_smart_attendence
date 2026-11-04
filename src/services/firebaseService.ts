import { AttendanceRecord, FirebaseConnectionConfig } from '../types/attendance';

const FIREBASE_CONFIG_KEY = 'rfid_firebase_rtdb_config_v1';

export const DEFAULT_FIREBASE_CONFIG: FirebaseConnectionConfig = {
  databaseURL: 'https://rajaryan-54107-default-rtdb.firebaseio.com',
  path: 'attendance',
  isConnected: true,
  lastSyncedAt: new Date().toISOString()
};

/**
 * Decodes the 48-bit server timestamp from a Firebase push ID.
 */
function decodeFirebasePushIdTimestamp(id: string): number | null {
  if (!id || id.length < 8) return null;
  const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  let timestamp = 0;
  for (let i = 0; i < 8; i++) {
    const char = id.charAt(i);
    const val = PUSH_CHARS.indexOf(char);
    if (val === -1) return null;
    timestamp = timestamp * 64 + val;
  }
  return timestamp > 0 ? timestamp : null;
}

export class FirebaseRealtimeService {
  private static instance: FirebaseRealtimeService;
  private config: FirebaseConnectionConfig;
  private listeners: ((records: AttendanceRecord[]) => void)[] = [];
  private pollingIntervalId: number | null = null;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): FirebaseRealtimeService {
    if (!FirebaseRealtimeService.instance) {
      FirebaseRealtimeService.instance = new FirebaseRealtimeService();
    }
    return FirebaseRealtimeService.instance;
  }

  public getConfig(): FirebaseConnectionConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<FirebaseConnectionConfig>): FirebaseConnectionConfig {
    this.config = {
      ...this.config,
      ...newConfig
    };
    try {
      localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save Firebase RTDB config to localStorage', e);
    }
    return { ...this.config };
  }

  private loadConfig(): FirebaseConnectionConfig {
    try {
      const data = localStorage.getItem(FIREBASE_CONFIG_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // If old placeholder URL was saved, override with user's live database URL
        if (!parsed.databaseURL || parsed.databaseURL.includes('smart-rfid-attendance-default-rtdb')) {
          parsed.databaseURL = 'https://rajaryan-54107-default-rtdb.firebaseio.com';
          parsed.isConnected = true;
        }
        return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse Firebase RTDB config', e);
    }
    return { ...DEFAULT_FIREBASE_CONFIG };
  }

  /**
   * Cleans and formats RTDB URL to ensure it ends without trailing slash.
   */
  public cleanDatabaseURL(url: string): string {
    let clean = url.trim();
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean;
  }

  /**
   * Test connection to Firebase Realtime Database via REST endpoint.
   */
  public async testConnection(databaseURL?: string): Promise<{ success: boolean; message: string; dataSample?: any }> {
    const targetUrl = this.cleanDatabaseURL(databaseURL || this.config.databaseURL);
    const endpoint = `${targetUrl}/attendance.json?shallow=true`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        this.saveConfig({
          databaseURL: targetUrl,
          isConnected: true,
          lastSyncedAt: new Date().toISOString()
        });
        return {
          success: true,
          message: 'Successfully connected to Firebase Realtime Database!',
          dataSample: data
        };
      } else {
        return {
          success: false,
          message: `Firebase returned HTTP ${response.status}: ${response.statusText}. Please verify database URL and security rules.`
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error connecting to Firebase Realtime Database. Check URL or CORS settings.'
      };
    }
  }

  /**
   * Fetch attendance records from Firebase Realtime Database path `attendance`.
   */
  public async fetchAttendanceRecords(): Promise<{ success: boolean; records: AttendanceRecord[]; rawCount?: number; error?: string }> {
    const targetUrl = this.cleanDatabaseURL(this.config.databaseURL);
    const endpoint = `${targetUrl}/attendance.json`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        return {
          success: false,
          records: [],
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const rawData = await response.json();
      if (!rawData) {
        return { success: true, records: [] };
      }

      // Convert Firebase RTDB dictionary or array to AttendanceRecord[]
      const parsedRecords: AttendanceRecord[] = [];
      const keys = Object.keys(rawData);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for (const key of keys) {
        const item = rawData[key];
        if (item && typeof item === 'object') {
          // Resolve UID
          const uid = String(item.UID || item.uid || '').trim().toUpperCase();
          
          // Resolve student name: map known UIDs if name is generic or missing
          let studentName = String(item['Student Name'] || item.studentName || item.name || '').trim();
          if (!studentName || studentName === 'Unknown') {
            if (uid === '16042907') studentName = 'Raj';
            else if (uid === '13F97330') studentName = 'Sai';
            else if (uid === '3ED4D106') studentName = 'Pranav';
            else studentName = `Tag-${uid}`;
          }

          // Resolve status
          const rawStatus = String(item.Status || item.status || 'Present').trim();
          const status: AttendanceRecord['status'] =
            rawStatus.toLowerCase() === 'absent' ? 'Absent' : rawStatus.toLowerCase() === 'late' ? 'Late' : 'Present';

          // Resolve accurate timestamp:
          // 1. If ISO string exists
          // 2. Or extract millisecond timestamp from Firebase push ID
          // 3. Or if timestamp_ms is a full unix ms timestamp
          let dateObj: Date;
          if (item.Timestamp && !isNaN(new Date(item.Timestamp).getTime())) {
            dateObj = new Date(item.Timestamp);
          } else if (item.timestamp && !isNaN(new Date(item.timestamp).getTime())) {
            dateObj = new Date(item.timestamp);
          } else {
            const pushTs = decodeFirebasePushIdTimestamp(key);
            if (pushTs && pushTs > 1500000000000) {
              dateObj = new Date(pushTs);
            } else if (typeof item.timestamp_ms === 'number' && item.timestamp_ms > 1500000000000) {
              dateObj = new Date(item.timestamp_ms);
            } else {
              // Fallback to recent date
              dateObj = new Date();
            }
          }

          const isoTimestamp = dateObj.toISOString();
          const dateStr = item.date || isoTimestamp.split('T')[0];
          const timeStr = item.time || dateObj.toTimeString().split(' ')[0];
          const dayName = item.dayOfWeek || dayNames[dateObj.getDay()];

          parsedRecords.push({
            id: key,
            uid: uid || '16042907',
            studentName,
            status,
            timestamp: isoTimestamp,
            date: dateStr,
            dayOfWeek: dayName,
            time: timeStr,
            deviceId: item.deviceId || 'ESP32_RC522_GATE_01',
            verifiedVia: (item.verifiedVia as any) || 'RFID_RC522'
          });
        }
      }

      // Sort descending (newest first)
      parsedRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      this.saveConfig({
        isConnected: true,
        lastSyncedAt: new Date().toISOString()
      });

      return {
        success: true,
        records: parsedRecords,
        rawCount: keys.length
      };
    } catch (err: any) {
      return {
        success: false,
        records: [],
        error: err.message || 'Error fetching records from Firebase'
      };
    }
  }

  /**
   * Push a single attendance record to Firebase Realtime Database `attendance` path.
   * Matches the user's required schema:
   * - UID
   * - Student Name
   * - Status
   * - Timestamp
   */
  public async pushAttendanceRecord(record: AttendanceRecord): Promise<{ success: boolean; key?: string; error?: string }> {
    const targetUrl = this.cleanDatabaseURL(this.config.databaseURL);
    const endpoint = `${targetUrl}/attendance.json`;

    const payload = {
      UID: record.uid,
      'Student Name': record.studentName,
      Status: record.status,
      Timestamp: record.timestamp,
      date: record.date,
      time: record.time,
      dayOfWeek: record.dayOfWeek,
      deviceId: record.deviceId || 'ESP32_RC522_GATE_01',
      verifiedVia: record.verifiedVia || 'RFID_RC522'
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const resData = await response.json();
      return {
        success: true,
        key: resData.name
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error pushing record to Firebase'
      };
    }
  }

  /**
   * Start periodic background sync if enabled.
   */
  public startLivePolling(callback: (records: AttendanceRecord[]) => void, intervalMs: number = 8000): void {
    this.stopLivePolling();
    this.pollingIntervalId = window.setInterval(async () => {
      if (this.config.isConnected) {
        const result = await this.fetchAttendanceRecords();
        if (result.success && result.records.length > 0) {
          callback(result.records);
        }
      }
    }, intervalMs);
  }

  public stopLivePolling(): void {
    if (this.pollingIntervalId !== null) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }
}

export const firebaseService = FirebaseRealtimeService.getInstance();
