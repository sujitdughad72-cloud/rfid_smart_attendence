import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { FirebaseConnectionConfig } from '../types/attendance';
import { firebaseService } from '../services/firebaseService';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FirebaseConnectionConfig;
  onSaveConfig: (newConfig: Partial<FirebaseConnectionConfig>) => void;
  onSync: () => Promise<void>;
  isSyncing: boolean;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSync,
  isSyncing
}) => {
  const [dbUrl, setDbUrl] = useState(config.databaseURL);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  if (!isOpen) return null;

  const sampleRules = `{
  "rules": {
    "attendance": {
      ".read": true,
      ".write": true,
      ".indexOn": ["UID", "Timestamp"]
    }
  }
}`;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await firebaseService.testConnection(dbUrl);
    setTestResult({
      tested: true,
      success: res.success,
      message: res.message
    });
    setIsTesting(false);
    if (res.success) {
      onSaveConfig({ databaseURL: dbUrl, isConnected: true });
    }
  };

  const handleSave = () => {
    onSaveConfig({ databaseURL: dbUrl });
    onClose();
  };

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(sampleRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase mb-1">
          <Database className="w-4 h-4" />
          <span>Realtime Cloud Sync</span>
        </div>

        <h2 className="text-xl font-extrabold text-white">
          Firebase Realtime Database Settings
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Connect your live Firebase RTDB instance to sync attendance scans directly with physical ESP32 RC522 hardware.
        </p>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Firebase Realtime Database URL *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={dbUrl}
                onChange={e => setDbUrl(e.target.value)}
                placeholder="https://your-project-default-rtdb.firebaseio.com"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-cyan-300 font-bold border border-slate-700 transition disabled:opacity-50 flex items-center space-x-1"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{isTesting ? 'Testing...' : 'Test URL'}</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                testResult.success
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}

          {/* Realtime Database Path Information */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Database Path:</span>
              <code className="text-cyan-300 font-mono font-bold">/attendance</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Payload Fields per Record:</span>
              <span className="text-white font-mono text-[11px]">UID, Student Name, Status, Timestamp</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Connection Status:</span>
              <span
                className={`font-bold ${
                  config.isConnected ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {config.isConnected ? 'Connected & Verified' : 'Standby / Local Cache'}
              </span>
            </div>
          </div>

          {/* Security Rules Helper */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-medium flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Recommended RTDB Security Rules:
              </span>
              <button
                type="button"
                onClick={copyRulesToClipboard}
                className="text-[11px] text-cyan-400 hover:underline flex items-center"
              >
                <Copy className="w-3 h-3 mr-1" />
                {copiedRules ? 'Copied!' : 'Copy Rules'}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
              {sampleRules}
            </pre>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Records Now'}</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-md shadow-cyan-600/30"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
