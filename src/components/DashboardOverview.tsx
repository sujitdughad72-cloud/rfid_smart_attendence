import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Radio,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  History,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  StudentStats,
  AIPredictionResult,
  RandomForestMetrics,
  FirebaseConnectionConfig
} from '../types/attendance';
import { TabKey } from './Sidebar';

import { LiveSensorFeed } from './LiveSensorFeed';

interface DashboardOverviewProps {
  students: Student[];
  records: AttendanceRecord[];
  studentStats: Record<string, StudentStats>;
  predictions: AIPredictionResult[];
  rfMetrics: RandomForestMetrics;
  firebaseConfig: FirebaseConnectionConfig;
  onSelectTab: (tab: TabKey) => void;
  onSimulateRfidScan: (uid: string) => void;
  onOpenFirebaseModal: () => void;
  onRetrainModel: () => void;
  isRetraining: boolean;
  onRefreshLiveSensor: () => Promise<void>;
  isPolling?: boolean;
  lastFetchedAt?: Date | null;
  rawCount?: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  students,
  records,
  studentStats,
  predictions,
  rfMetrics,
  firebaseConfig,
  onSelectTab,
  onSimulateRfidScan,
  onOpenFirebaseModal,
  onRetrainModel,
  isRetraining,
  onRefreshLiveSensor,
  isPolling = true,
  lastFetchedAt = null,
  rawCount
}) => {
  // Aggregate metrics
  const totalStudents = students.length;
  const totalRecords = records.length;

  const totalPossible = Object.values(studentStats).reduce((sum, s) => sum + s.totalClasses, 0);
  const totalAttended = Object.values(studentStats).reduce((sum, s) => sum + s.attendedClasses, 0);
  const overallAvgAttendance =
    totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 1000) / 10 : 0;

  const atRiskStudents = Object.values(studentStats).filter(s => s.attendancePercentage < 75);
  const mediumRiskStudents = Object.values(studentStats).filter(
    s => s.attendancePercentage >= 75 && s.attendancePercentage < 82
  );

  // Latest 5 punches
  const recentPunches = records.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Live Firebase RTDB Sensor Reading Stream */}
      <LiveSensorFeed
        records={records}
        firebaseConfig={firebaseConfig}
        onRefreshLiveSensor={onRefreshLiveSensor}
        isPolling={isPolling}
        lastFetchedAt={lastFetchedAt}
        rawCount={rawCount}
      />
      {/* Top Banner: Realtime ESP32 & ML Engine Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/70 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Smart IoT Attendance Infrastructure</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              AI-Based RFID Attendance & Predictive Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Automated punch capture via ESP32 & RC522 RFID reader with Firebase Realtime Database
              persistence and ensemble Random Forest attendance trajectory modeling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => onSelectTab('live-rfid')}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/30 transition border border-cyan-400/40"
            >
              <Radio className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
              Live RFID Gate Reader
            </button>
            <button
              onClick={onRetrainModel}
              disabled={isRetraining}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-violet-200 bg-violet-950/80 hover:bg-violet-900/80 border border-violet-700/60 transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isRetraining ? 'animate-spin' : ''}`} />
              {isRetraining ? 'Training Forest...' : 'Retrain ML Model'}
            </button>
          </div>
        </div>

        {/* Quick RFID Tap Bar for Registered Students */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center">
              <Cpu className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Instant Card Simulator (Tap Registered Cards):
            </span>
            <span className="text-[11px] text-slate-400">
              Matches physical ESP32 RC522 hardware scans
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {students.slice(0, 3).map(student => {
              const stats = studentStats[student.uid];
              const pct = stats?.attendancePercentage ?? 0;
              const isDanger = pct < 75;

              return (
                <button
                  key={student.uid}
                  onClick={() => onSimulateRfidScan(student.uid)}
                  className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 hover:border-cyan-500/60 transition shadow-sm text-left active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition flex items-center space-x-1.5">
                        <span className="truncate">{student.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">({student.uid})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Attendance: <span className={isDanger ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>{pct}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 pl-2">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/60 group-hover:bg-cyan-600 group-hover:text-white transition">
                      Tap Card
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Registered Students */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Students</span>
            <div className="p-2 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/50">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalStudents}</span>
            <span className="text-xs font-medium text-slate-400">Active RFID Tags</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Raj, Sai, Pranav</span>
            <button
              onClick={() => onSelectTab('students')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center font-medium"
            >
              View Cards <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Metric 2: Overall Attendance % */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cohort Attendance</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{overallAvgAttendance}%</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {totalRecords} Records
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Threshold: 75.0%</span>
            <button
              onClick={() => onSelectTab('analytics')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center font-medium"
            >
              Analytics <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Metric 3: Students At Risk */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">75% Deficit Alert</span>
            <div
              className={`p-2 rounded-xl border ${
                atRiskStudents.length > 0
                  ? 'bg-rose-950/60 text-rose-400 border-rose-800/50 animate-pulse'
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold ${
                atRiskStudents.length > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {atRiskStudents.length}
            </span>
            <span className="text-xs font-medium text-slate-400">Below 75% Limit</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>{mediumRiskStudents.length} on watchlist</span>
            <button
              onClick={() => onSelectTab('risk-analysis')}
              className="text-rose-400 hover:text-rose-300 flex items-center font-medium"
            >
              Risk Audit <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Metric 4: Random Forest Accuracy */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Random Forest ML</span>
            <div className="p-2 rounded-xl bg-violet-950/60 text-violet-400 border border-violet-800/50">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{rfMetrics.oobAccuracy}%</span>
            <span className="text-xs font-medium text-violet-300">OOB Accuracy</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>{rfMetrics.totalTrees} Decision Trees</span>
            <button
              onClick={() => onSelectTab('ai-prediction')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center font-medium"
            >
              Predictions <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Row: AI Next-Class Prediction Summary + Live RFID Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Next-Class Attendance Predictions */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <BrainCircuit className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  AI Attendance Forecast (Upcoming Session)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Classified by ensemble Random Forest trees using historical consecutive absences & pattern variance.
              </p>
            </div>
            <button
              onClick={() => onSelectTab('ai-prediction')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center"
            >
              Full Model Details <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="space-y-3">
            {predictions.map(pred => {
              const isPresent = pred.predictedStatus === 'Present';
              const riskColor =
                pred.attendanceRisk === 'High'
                  ? 'text-rose-400 bg-rose-950/60 border-rose-800'
                  : pred.attendanceRisk === 'Medium'
                  ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                  : 'text-emerald-400 bg-emerald-950/60 border-emerald-800';

              return (
                <div
                  key={pred.uid}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-sm border border-slate-700">
                        {pred.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white">{pred.studentName}</span>
                          <span className="text-[11px] font-mono text-slate-400">UID: {pred.uid}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskColor}`}>
                            {pred.attendanceRisk} Risk
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Current: <span className="font-semibold text-slate-200">{pred.currentAttendancePercentage}%</span> → Projected:{' '}
                          <span className={pred.projectedAttendancePercentage < 75 ? 'font-bold text-rose-400' : 'font-semibold text-slate-200'}>
                            {pred.projectedAttendancePercentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-400">RF Confidence</div>
                        <div className="text-sm font-extrabold text-violet-300 font-mono">
                          {pred.confidencePercentage}%
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1 border ${
                          isPresent
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                            : 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                        }`}
                      >
                        {isPresent ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                        <span>Predicted: {pred.predictedStatus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Insight Snippet */}
                  {pred.personalizedInsights.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300 flex items-start space-x-1.5">
                      <span className="text-violet-400 font-bold shrink-0">AI Insight:</span>
                      <span className="text-slate-400 truncate">{pred.personalizedInsights[0]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Recent RFID Scan Feed */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Attendance Feed
                </h2>
              </div>
              <button
                onClick={() => onSelectTab('history')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center"
              >
                All Logs <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentPunches.map(record => {
                const isPresent = record.status === 'Present';
                const isLate = record.status === 'Late';
                const badgeColor = isPresent
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : isLate
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-rose-950 text-rose-300 border-rose-800';

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/70 text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <div className="truncate">
                        <div className="font-bold text-white truncate">{record.studentName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{record.uid}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="text-right text-[11px] text-slate-400">
                        <div>{record.date}</div>
                        <div className="font-mono text-[10px] text-slate-500">{record.time}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Hardware Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center">
                <Radio className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Reader: ESP32_RC522_GATE_01
              </span>
              <button
                onClick={onOpenFirebaseModal}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                RTDB Sync →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
