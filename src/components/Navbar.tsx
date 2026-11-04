import React, { useState, useEffect } from 'react';
import {
  Radio,
  Cpu,
  Database,
  Volume2,
  VolumeX,
  Code2,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { FirebaseConnectionConfig } from '../types/attendance';
import { soundManager } from '../utils/audio';

interface NavbarProps {
  firebaseConfig: FirebaseConnectionConfig;
  onOpenFirebaseModal: () => void;
  onOpenEsp32Modal: () => void;
  onQuickScanClick: () => void;
  onSyncFirebase: () => Promise<void>;
  isSyncing: boolean;
  totalStudents: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  firebaseConfig,
  onOpenFirebaseModal,
  onOpenEsp32Modal,
  onQuickScanClick,
  onSyncFirebase,
  isSyncing
}) => {
  const [time, setTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
    if (!next) {
      soundManager.playRfidBeep();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Hardware Badges */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white font-bold">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Smart RFID Attendance
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60 uppercase tracking-wider">
                  ESP32 + RC522
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-950 text-violet-400 border border-violet-800/60 uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  Random Forest ML
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Firebase Realtime Database & Predictive Pattern Classifier
              </p>
            </div>
          </div>

          {/* Center / Time Status */}
          <div className="hidden lg:flex items-center space-x-4 bg-slate-950/60 px-3.5 py-1.5 rounded-lg border border-slate-800/80">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-medium text-slate-300">{time || '09:00:00'}</span>
            <span className="text-slate-600">|</span>
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-medium text-[11px]">Gate 01 Reader Active</span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute RFID Beeps' : 'Mute RFID Beeps'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* ESP32 Arduino Code Modal Trigger */}
            <button
              onClick={onOpenEsp32Modal}
              title="ESP32 RC522 Firmware & Wiring"
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition"
            >
              <Code2 className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              ESP32 Code
            </button>

            {/* Firebase Database Connection Status */}
            <button
              onClick={onOpenFirebaseModal}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                firebaseConfig.isConnected
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                  : 'bg-slate-800/90 text-amber-300 border-amber-800/60 hover:bg-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden md:inline">Firebase RTDB:</span>
              <span className="ml-1 font-semibold">
                {firebaseConfig.isConnected ? 'Connected' : 'Setup'}
              </span>
              <span
                className={`ml-1.5 w-2 h-2 rounded-full ${
                  firebaseConfig.isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
            </button>

            {/* Sync Button */}
            <button
              onClick={onSyncFirebase}
              disabled={isSyncing}
              title="Sync with Firebase Realtime Database"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Tap RFID Card Button */}
            <button
              onClick={onQuickScanClick}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-md shadow-cyan-600/20 transition active:scale-95 border border-cyan-400/30"
            >
              <Cpu className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
              <span>Tap RFID</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
