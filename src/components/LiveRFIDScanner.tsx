import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Cpu,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Database,
  Volume2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Student, AttendanceRecord, FirebaseConnectionConfig } from '../types/attendance';
import { soundManager } from '../utils/audio';

interface LiveRFIDScannerProps {
  students: Student[];
  records: AttendanceRecord[];
  firebaseConfig: FirebaseConnectionConfig;
  onScanUID: (uid: string, customStatus?: 'Present' | 'Late') => void;
  onOpenEsp32Modal: () => void;
  onRefreshLiveSensor?: () => Promise<void>;
  isPolling?: boolean;
  rawCount?: number;
}

export const LiveRFIDScanner: React.FC<LiveRFIDScannerProps> = ({
  students,
  records,
  firebaseConfig,
  onScanUID,
  onOpenEsp32Modal,
  onRefreshLiveSensor,
  isPolling = true,
  rawCount
}) => {
  const [customUidInput, setCustomUidInput] = useState('');
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [lastScannedResult, setLastScannedResult] = useState<{
    uid: string;
    studentName: string;
    status: 'Present' | 'Late';
    timestamp: string;
    isSuccess: boolean;
  } | null>(null);

  const [activeRipple, setActiveRipple] = useState(false);
  const [debounceSecondsRemaining, setDebounceSecondsRemaining] = useState(0);

  // Auto focus input for USB RFID keyboard wedge scanners
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (debounceSecondsRemaining > 0) {
      timer = setTimeout(() => {
        setDebounceSecondsRemaining(s => s - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [debounceSecondsRemaining]);

  const triggerScan = (uid: string) => {
    const cleanUid = uid.trim().toUpperCase();
    if (!cleanUid) return;

    // Check debounce
    if (debounceSecondsRemaining > 0 && lastScannedResult?.uid === cleanUid) {
      soundManager.playWarningBeep();
      return;
    }

    // Audio beep
    soundManager.playRfidBeep();

    // Trigger visual radio pulse
    setActiveRipple(true);
    setTimeout(() => setActiveRipple(false), 900);

    const matchedStudent = students.find(s => s.uid.toLowerCase() === cleanUid.toLowerCase());
    const studentName = matchedStudent ? matchedStudent.name : 'Unregistered Visitor';

    // Decide status based on current time (e.g., if after 09:15 AM considered Late)
    const now = new Date();
    const isLate = now.getMinutes() > 30; // demo threshold
    const status: 'Present' | 'Late' = isLate ? 'Late' : 'Present';

    setLastScannedResult({
      uid: cleanUid,
      studentName,
      status,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isSuccess: !!matchedStudent
    });

    setDebounceSecondsRemaining(4);
    onScanUID(cleanUid, status);
    setCustomUidInput('');
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerScan(customUidInput);
  };

  // 10 most recent live scans
  const liveRecentLogs = records.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Hardware Terminal Emulation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Live RFID Gate Scanner (ESP32 + RC522)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Active 13.56 MHz RFID radio field listening for Mifare Classic tags and pushing to Firebase RTDB.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onRefreshLiveSensor && (
            <button
              onClick={onRefreshLiveSensor}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 border border-cyan-400/40 transition shadow-sm"
            >
              <Radio className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
              Fetch Live Sensor Reading
            </button>
          )}

          <button
            onClick={onOpenEsp32Modal}
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <Cpu className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Hardware Pinout & C++ Sketch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Interactive RFID Scanner Reader Visualizer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
            {/* Top Reader Hardware Indicators */}
            <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-emerald-400">RC522 ONLINE</span>
                <span className="text-[10px] text-slate-500 font-mono">SPI 13.56MHz</span>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span className="flex items-center font-mono">
                  <Wifi className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  ESP32 WiFi OK
                </span>
                <span className="flex items-center font-mono">
                  <Database className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  RTDB /attendance
                </span>
              </div>
            </div>

            {/* Glowing Antenna & Contactless Tap Pad */}
            <div className="relative my-4 flex items-center justify-center">
              {/* Radio Waves Animation */}
              {activeRipple && (
                <>
                  <div className="absolute w-64 h-64 rounded-full border-2 border-cyan-400/60 animate-ping pointer-events-none" />
                  <div className="absolute w-80 h-80 rounded-full border border-cyan-400/30 animate-pulse pointer-events-none" />
                </>
              )}

              {/* RFID Reader Pad Box */}
              <div
                className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl p-4 flex flex-col items-center justify-center transition-all duration-300 border-2 shadow-2xl ${
                  activeRipple
                    ? 'bg-cyan-950/80 border-cyan-400 scale-105 shadow-cyan-500/40 ring-4 ring-cyan-500/20'
                    : 'bg-slate-950/90 border-slate-700/80 hover:border-cyan-500/50 shadow-slate-950'
                }`}
              >
                {/* PCB Trace Graphics */}
                <div className="absolute inset-3 rounded-2xl border border-cyan-500/20 border-dashed pointer-events-none" />
                <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-400/60">RC522-RFID</div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-600">3.3V SPI</div>

                <div className="relative z-10 flex flex-col items-center space-y-2">
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-inner">
                    <Radio className={`w-8 h-8 sm:w-10 sm:h-10 ${activeRipple ? 'animate-bounce text-cyan-200' : 'animate-pulse'}`} />
                  </div>
                  <div className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                    TAP CARD HERE
                  </div>
                  <div className="text-[11px] font-medium text-cyan-400/80">
                    Contactless Sensing Area
                  </div>
                </div>
              </div>
            </div>

            {/* Debounce Notice */}
            {debounceSecondsRemaining > 0 && (
              <div className="mt-3 text-xs font-mono text-amber-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Anti-Bounce Active ({debounceSecondsRemaining}s) - Prevents Double Punch</span>
              </div>
            )}

            {/* Last Scan Result Card */}
            {lastScannedResult && (
              <div
                className={`w-full mt-6 p-4 rounded-2xl border text-left transition-all ${
                  lastScannedResult.isSuccess
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {lastScannedResult.isSuccess ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                      <div className="font-bold text-sm text-white">
                        {lastScannedResult.studentName}
                      </div>
                      <div className="text-xs font-mono opacity-80">
                        UID: {lastScannedResult.uid} • {lastScannedResult.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">
                      {lastScannedResult.timestamp}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                      Saved to Firebase
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Instant Tap 3 Registered Student Buttons */}
            <div className="w-full mt-6 pt-5 border-t border-slate-800/80">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-left">
                Registered Hardware Tags (1-Click Tap Simulator):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {students.slice(0, 3).map(student => (
                  <button
                    key={student.uid}
                    onClick={() => triggerScan(student.uid)}
                    className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 transition text-left group shadow-sm active:scale-95"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white group-hover:text-cyan-300">
                        {student.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                        TAP
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      UID: {student.uid}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {student.rollNumber}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual UID or USB Scanner Input */}
            <form onSubmit={handleManualScanSubmit} className="w-full mt-5 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Or scan / enter RFID UID (e.g. 16042907)..."
                value={customUidInput}
                onChange={e => setCustomUidInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md shadow-cyan-600/30 flex items-center"
              >
                <span>Punch</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </form>
          </div>
        </div>

        {/* Right 5 Cols: Live Terminal Logs & Scanner Specs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Scanner Log Feed */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Gate 01 Activity Stream
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Live RTDB Sink</span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {liveRecentLogs.map((log, idx) => {
                  const isPresent = log.status === 'Present';
                  const isLate = log.status === 'Late';

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
                            isPresent ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {log.studentName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{log.studentName}</div>
                          <div className="text-[11px] font-mono text-slate-400">UID: {log.uid}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPresent
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : isLate
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          {log.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hardware Pinout Cheat Sheet */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>RC522 Pinout Cheat Sheet:</span>
                <span className="text-[10px] font-mono text-cyan-400">SPI Bus</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                <div>SDA (SS) → GPIO 5</div>
                <div>SCK → GPIO 18</div>
                <div>MOSI → GPIO 23</div>
                <div>MISO → GPIO 19</div>
                <div>RST → GPIO 22</div>
                <div>VCC → 3.3V (Strict)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
