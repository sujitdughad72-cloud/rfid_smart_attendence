import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { Student, StudentStats, RiskAnalysisItem } from '../types/attendance';

interface StudentRiskAnalysisProps {
  students: Student[];
  studentStats: Record<string, StudentStats>;
  riskItems: RiskAnalysisItem[];
  onExportRiskCSV: () => void;
}

export const StudentRiskAnalysis: React.FC<StudentRiskAnalysisProps> = ({
  students,
  studentStats,
  riskItems,
  onExportRiskCSV
}) => {
  const [selectedNoticeStudent, setSelectedNoticeStudent] = useState<RiskAnalysisItem | null>(null);

  const highRisk = riskItems.filter(r => r.riskLevel === 'High');
  const mediumRisk = riskItems.filter(r => r.riskLevel === 'Medium');
  const lowRisk = riskItems.filter(r => r.riskLevel === 'Low');

  const openNoticeModal = (item: RiskAnalysisItem) => {
    setSelectedNoticeStudent(item);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Institutional Compliance Monitor</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Student Attendance Risk Analysis & Early Warnings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Strict surveillance of the mandatory 75% institutional threshold with recovery path projection.
          </p>
        </div>

        <button
          onClick={onExportRiskCSV}
          className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
          Export Risk Audit Report
        </button>
      </div>

      {/* Risk Tiers Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* High Risk (< 75%) */}
        <div className="rounded-2xl bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-800/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Critical / High Risk
              </span>
            </div>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{highRisk.length}</span>
            <span className="text-xs text-rose-300 font-medium">Students &lt; 75%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Imminent danger of semester debarment. Requires immediate parent & faculty intervention.
          </p>
        </div>

        {/* Medium Risk (75% - 82%) */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Advisory / Medium Risk
              </span>
            </div>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{mediumRisk.length}</span>
            <span className="text-xs text-amber-300 font-medium">Watchlist Buffer</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Attendance hovering between 75% - 82%. 1 or 2 missed classes will plunge into red.
          </p>
        </div>

        {/* Low Risk (>= 82%) */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Safe / Low Risk
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{lowRisk.length}</span>
            <span className="text-xs text-emerald-300 font-medium">Full Compliance</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Healthy attendance above 82%. Safe margin for all upcoming semester examinations.
          </p>
        </div>
      </div>

      {/* Granular Risk Breakdown Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Student Compliance & Recovery Metrics
          </h2>
          <span className="text-xs text-slate-400">75% Mandatory Cutoff Rule</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3 font-mono">UID</th>
                <th className="px-4 py-3">Current Attendance</th>
                <th className="px-4 py-3">Risk Tier</th>
                <th className="px-4 py-3">Recovery Required</th>
                <th className="px-4 py-3">Buffer Margin</th>
                <th className="px-4 py-3">Trend</th>
                <th className="px-4 py-3 text-right">Early Warning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {riskItems.map(item => {
                const isHigh = item.riskLevel === 'High';
                const isMedium = item.riskLevel === 'Medium';

                const tierBadge = isHigh
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : isMedium
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800';

                return (
                  <tr key={item.uid} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3.5 font-bold text-white flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-md bg-slate-800 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                        {item.name.charAt(0)}
                      </div>
                      <span>{item.name}</span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-cyan-400 font-medium">
                      {item.uid}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm font-black ${
                            isHigh ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {item.currentPercentage}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${tierBadge}`}>
                        {item.riskLevel}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {item.classesNeededFor75 > 0 ? (
                        <div className="font-bold text-rose-400 flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Must attend next {item.classesNeededFor75} classes</span>
                        </div>
                      ) : (
                        <span className="text-emerald-400 font-medium">Compliant (0 needed)</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {item.safeAbsencesAllowed > 0 ? (
                        <span className="text-slate-300">
                          Can miss up to <strong className="text-white">{item.safeAbsencesAllowed}</strong> classes
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">0 buffer (Zero tolerance)</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1">
                        {item.trend === 'Improving' && (
                          <span className="text-emerald-400 font-medium flex items-center">
                            <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Improving
                          </span>
                        )}
                        {item.trend === 'Declining' && (
                          <span className="text-rose-400 font-medium flex items-center">
                            <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> Declining
                          </span>
                        )}
                        {item.trend === 'Stable' && (
                          <span className="text-slate-400 font-medium">Stable</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {isHigh ? (
                        <button
                          onClick={() => openNoticeModal(item)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 transition"
                        >
                          Generate Warning Notice
                        </button>
                      ) : isMedium ? (
                        <button
                          onClick={() => openNoticeModal(item)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900 border border-amber-700/60 transition"
                        >
                          Advisory Slip
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-medium">In Good Standing</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Warning Notice Modal */}
      {selectedNoticeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setSelectedNoticeStudent(null)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Official Institutional Notice</span>
            </div>

            <h3 className="text-lg font-black text-white">
              Attendance Shortage Early Warning Notice
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Generated automatically by Smart RFID Attendance AI Engine.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3 font-mono">
              <div className="border-b border-slate-800 pb-2 flex justify-between text-slate-400">
                <span>DATE: {new Date().toLocaleDateString()}</span>
                <span>NOTICE REF: RFID-WARN-75</span>
              </div>

              <div>
                <span className="text-slate-400">STUDENT: </span>
                <strong className="text-white">{selectedNoticeStudent.name}</strong>
              </div>

              <div>
                <span className="text-slate-400">RFID UID: </span>
                <strong className="text-cyan-400">{selectedNoticeStudent.uid}</strong>
              </div>

              <div>
                <span className="text-slate-400">RECORDED ATTENDANCE: </span>
                <strong className="text-rose-400">{selectedNoticeStudent.currentPercentage}%</strong>{' '}
                <span className="text-slate-500">(Required: 75.0%)</span>
              </div>

              <div>
                <span className="text-slate-400">DEFICIT RECOVERY MANDATE: </span>
                <strong className="text-amber-300">
                  Student must attend the next {selectedNoticeStudent.classesNeededFor75} consecutive class sessions without fail.
                </strong>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 leading-relaxed font-sans">
                Failure to attain the mandatory 75% threshold by the end of the semester will disqualify the student from appearing in the Semester End Examinations under University Academic Regulation Clause 4.2.
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedNoticeStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-600/30"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
