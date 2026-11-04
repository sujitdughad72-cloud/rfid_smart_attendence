import React, { useState } from 'react';
import {
  Radio,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Clock,
  Database,
  Code2,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Wifi
} from 'lucide-react';
import { AttendanceRecord, FirebaseConnectionConfig } from '../types/attendance';

interface LiveSensorFeedProps {
  records: AttendanceRecord[];
  firebaseConfig: FirebaseConnectionConfig;
  onRefreshLiveSensor: () => Promise<void>;
  isPolling: boolean;
  lastFetchedAt: Date | null;
  rawCount?: number;
}

export const LiveSensorFeed: React.FC<LiveSensorFeedProps> = ({
  records,
  firebaseConfig,
  onRefreshLiveSensor,
  isPolling,
  lastFetchedAt,
  rawCount
}) => {
  const [showRawJson, setShowRawJson] = useState(false);
  const [isManualFetching, setIsManualFetching] = useState(false);

  const latestScan = records[0];

  const handleManualFetch = async () => {
    setIsManualFetching(true);
    await onRefreshLiveSensor();
    setIsManualFetching(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-cyan-800/60 p-4 sm:p-5 shadow-xl">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/60 shadow-sm">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Live Sensor Feed
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>STREAMING</span>
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate max-w-sm sm:max-w-md">
              {firebaseConfig.databaseURL}/attendance
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleManualFetch}
            disabled={isManualFetching}
            className="inline-flex items-center px-3 py-1.5 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition disabled:opacity-50 text-xs border border-cyan-400/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isManualFetching ? 'animate-spin' : ''}`} />
            <span>Fetch Sensor Now</span>
          </button>

          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition"
            title="Toggle Raw JSON"
          >
            <Code2 className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Sensor Hero Metrics */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        {/* Latest Scanned Student */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-md">
            {latestScan?.studentName?.charAt(0) || 'R'}
          </div>
          <div className="truncate">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Latest Card Detected</div>
            <div className="font-extrabold text-white text-sm truncate">
              {latestScan?.studentName || 'Raj'}
            </div>
            <div className="font-mono text-cyan-400 text-[11px] truncate">
              UID: {latestScan?.uid || '16042907'}
            </div>
          </div>
        </div>

        {/* Verification & Status */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Hardware Status</div>
          <div className="mt-1 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold text-emerald-400 text-sm">
              {latestScan?.status || 'Present'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            RC522 13.56 MHz RFID
          </div>
        </div>

        {/* Last Scan Time / Timestamp */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Last Reading Time</div>
          <div className="font-bold text-white font-mono text-sm mt-1">
            {latestScan?.time || 'Live'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">
            {latestScan?.date || new Date().toISOString().split('T')[0]}
          </div>
        </div>

        {/* Total Sensor Logs in Firebase */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Sensor Pushes in RTDB</div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-black text-cyan-300 font-mono">
              {rawCount || records.length}
            </span>
            <span className="text-[11px] text-slate-400">Punches</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
            <Activity className="w-2.5 h-2.5 mr-0.5 animate-pulse" />
            <span>Poll: 3s auto-sync</span>
          </div>
        </div>
      </div>

      {/* Raw JSON inspection accordion */}
      {showRawJson && (
        <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-cyan-800/80 text-[11px] font-mono">
          <div className="flex items-center justify-between text-slate-400 mb-1 border-b border-slate-800 pb-1">
            <span>Live Payload Sample (/attendance)</span>
            <span className="text-cyan-400">GET https://rajaryan-54107-default-rtdb.firebaseio.com/attendance.json</span>
          </div>
          <pre className="text-cyan-300 max-h-40 overflow-y-auto overflow-x-auto leading-relaxed">
            {JSON.stringify(latestScan, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
