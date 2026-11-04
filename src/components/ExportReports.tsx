import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowDownToLine,
  Table
} from 'lucide-react';
import { AttendanceRecord, RiskAnalysisItem, AIPredictionResult } from '../types/attendance';
import { ExportService } from '../services/exportService';

interface ExportReportsProps {
  records: AttendanceRecord[];
  riskItems: RiskAnalysisItem[];
  predictions: AIPredictionResult[];
}

export const ExportReports: React.FC<ExportReportsProps> = ({
  records,
  riskItems,
  predictions
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const triggerSuccessMessage = (name: string) => {
    setDownloadSuccess(name);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleExportAttendanceCSV = () => {
    const filename = `attendance_records_${new Date().toISOString().split('T')[0]}.csv`;
    ExportService.exportAttendanceToCSV(records, filename);
    triggerSuccessMessage(filename);
  };

  const handleExportAttendanceExcel = () => {
    const filename = `attendance_records_${new Date().toISOString().split('T')[0]}.xls`;
    ExportService.exportAttendanceToExcel(records, filename);
    triggerSuccessMessage(filename);
  };

  const handleExportRiskCSV = () => {
    const filename = `student_risk_assessment_${new Date().toISOString().split('T')[0]}.csv`;
    ExportService.exportRiskAnalysisToCSV(riskItems, filename);
    triggerSuccessMessage(filename);
  };

  const handleExportPredictionsCSV = () => {
    const filename = `rf_attendance_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    ExportService.exportPredictionsToCSV(predictions, filename);
    triggerSuccessMessage(filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-1">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Data Extraction & Compliance</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Export Attendance & AI Prediction Reports
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Generate production-ready CSV and Microsoft Excel (.xls) spreadsheets for academic reporting.
        </p>
      </div>

      {/* Success Notification */}
      {downloadSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            Successfully generated and downloaded report: <strong>{downloadSuccess}</strong>
          </span>
        </div>
      )}

      {/* 3 Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Report 1: Attendance Ledger */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 flex items-center justify-center mb-3">
              <Table className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white mb-1">
              Historical Attendance Log
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Complete raw database records containing student UID, names, timestamps, gate device IDs, and verification statuses.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1 mb-4">
              <div className="flex justify-between text-slate-400">
                <span>Total Entries:</span>
                <span className="font-bold text-white font-mono">{records.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sync Source:</span>
                <span className="text-cyan-400 font-mono">Firebase /attendance</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportAttendanceCSV}
              className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-cyan-600/30"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Export as CSV (.csv)</span>
            </button>
            <button
              onClick={handleExportAttendanceExcel}
              className="w-full py-2 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center justify-center space-x-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export as Excel (.xls)</span>
            </button>
          </div>
        </div>

        {/* Report 2: Student Risk & 75% Audit */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 transition p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/60 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white mb-1">
              75% Compliance & Risk Audit
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Official audit of student attendance percentages, deficit gap, and exact number of recovery classes required before semester debarment.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1 mb-4">
              <div className="flex justify-between text-slate-400">
                <span>Audited Students:</span>
                <span className="font-bold text-white font-mono">{riskItems.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>At-Risk Students:</span>
                <span className="text-rose-400 font-mono font-bold">
                  {riskItems.filter(r => r.riskLevel === 'High').length}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportRiskCSV}
              className="w-full py-2 px-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-rose-700/30"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Export Risk Audit (CSV)</span>
            </button>
          </div>
        </div>

        {/* Report 3: AI Random Forest Predictions */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/40 transition p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-950/80 text-violet-400 border border-violet-800/60 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white mb-1">
              AI Attendance Forecast Report
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Model-generated predictions for upcoming classes including Random Forest ensemble confidence, trend trajectory, and personalized advice.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1 mb-4">
              <div className="flex justify-between text-slate-400">
                <span>Model Engine:</span>
                <span className="font-bold text-violet-300">Random Forest (21 Trees)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Projected Target:</span>
                <span className="text-white">Next Weekday Class</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportPredictionsCSV}
              className="w-full py-2 px-3 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-violet-700/30"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Export Forecast (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Table of Recent Export Rows */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Export Sample Data Preview (First 5 Rows)
          </h3>
          <span className="text-xs font-mono text-slate-500">attendance.csv</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-2.5">UID</th>
                <th className="px-4 py-2.5">Student Name</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {records.slice(0, 5).map(r => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 font-mono text-cyan-400">{r.uid}</td>
                  <td className="px-4 py-2.5 font-medium text-white">{r.studentName}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'Present'
                          ? 'bg-emerald-950 text-emerald-300'
                          : r.status === 'Late'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-rose-950 text-rose-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{r.date}</td>
                  <td className="px-4 py-2.5 font-mono">{r.time}</td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{r.verifiedVia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
