import React, { useState } from 'react';
import {
  Code2,
  X,
  Copy,
  Check,
  Cpu,
  Radio,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { getESP32ArduinoCode } from '../utils/esp32Code';

interface ESP32CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  databaseUrl: string;
}

export const ESP32CodeModal: React.FC<ESP32CodeModalProps> = ({
  isOpen,
  onClose,
  databaseUrl
}) => {
  const [copied, setCopied] = useState(false);
  const code = getESP32ArduinoCode(databaseUrl);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative text-slate-200 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase mb-1">
          <Cpu className="w-4 h-4" />
          <span>Microcontroller Firmware</span>
        </div>

        <h2 className="text-xl font-extrabold text-white">
          ESP32 + RC522 Arduino C++ Firmware Sketch
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Flash this sketch into your physical ESP32 board to transmit RFID scans live to Firebase Realtime Database.
        </p>

        {/* Pinout quick card */}
        <div className="mb-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="text-xs font-bold text-white mb-2 flex items-center justify-between">
            <span className="flex items-center">
              <Radio className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              RC522 RFID SPI Wiring to ESP32:
            </span>
            <span className="text-[10px] font-mono text-amber-400">Power: 3.3V ONLY</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-300">
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">SDA (SS) → GPIO 5</div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">SCK → GPIO 18</div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">MOSI → GPIO 23</div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">MISO → GPIO 19</div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">RST → GPIO 22</div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">GND → GND</div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">VCC → 3.3V</div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">Buzzer → GPIO 4</div>
          </div>
        </div>

        {/* Code View with Copy Button */}
        <div className="relative flex-1 min-h-[300px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
            <span className="font-mono text-slate-400">ESP32_RC522_Firebase_Attendance.ino</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-slate-300 leading-relaxed">
            {code}
          </pre>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Required Arduino Libraries: <code className="text-cyan-300">MFRC522</code>, <code className="text-cyan-300">Firebase-ESP-Client</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
