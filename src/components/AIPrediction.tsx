import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  BarChart,
  HelpCircle,
  RefreshCw,
  GitBranch,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import {
  Student,
  StudentStats,
  AIPredictionResult,
  RandomForestMetrics
} from '../types/attendance';
import { RandomForestClassifier, FEATURE_NAMES } from '../services/randomForest';

interface AIPredictionProps {
  students: Student[];
  studentStats: Record<string, StudentStats>;
  predictions: AIPredictionResult[];
  rfMetrics: RandomForestMetrics;
  rfModel: RandomForestClassifier;
  onRetrainModel: () => void;
  isRetraining: boolean;
}

export const AIPrediction: React.FC<AIPredictionProps> = ({
  students,
  studentStats,
  predictions,
  rfMetrics,
  rfModel,
  onRetrainModel,
  isRetraining
}) => {
  // Simulator State
  const [simStudentUid, setSimStudentUid] = useState<string>(students[0]?.uid || '16042907');
  const [simDayOfWeek, setSimDayOfWeek] = useState<number>(1); // 1 = Monday
  const [simConsecutiveAbsences, setSimConsecutiveAbsences] = useState<number>(0);
  const [simRecentAttendancePct, setSimRecentAttendancePct] = useState<number>(80);
  const [simOverallAttendancePct, setSimOverallAttendancePct] = useState<number>(85);

  const activeSimStudent = students.find(s => s.uid === simStudentUid) || students[0];

  // Run simulation on the fly with the active RF model
  const runSimulation = () => {
    const featureVector = [
      simOverallAttendancePct,
      32, // total conducted
      Math.round((simOverallAttendancePct / 100) * 32),
      simRecentAttendancePct,
      simConsecutiveAbsences,
      simDayOfWeek,
      simRecentAttendancePct // day pattern
    ];

    return rfModel.predict(featureVector);
  };

  const simResult = runSimulation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-violet-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <BrainCircuit className="w-4 h-4" />
            <span>Machine Learning Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Random Forest Attendance Prediction System
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Non-linear ensemble classification with Gini impurity splitting, out-of-bag validation, and trend forecasting.
          </p>
        </div>

        <button
          onClick={onRetrainModel}
          disabled={isRetraining}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/30 transition disabled:opacity-50 border border-violet-400/30"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRetraining ? 'animate-spin' : ''}`} />
          {isRetraining ? 'Training Forest Ensemble...' : 'Retrain Random Forest'}
        </button>
      </div>

      {/* Model Performance Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-indigo-950/60 border border-violet-800/40 p-4 sm:p-5 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border-r border-slate-850 pr-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ensemble Architecture
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {rfMetrics.totalTrees} Trees
            </div>
            <div className="text-[11px] text-violet-300">Feature Bagging: √p = 2</div>
          </div>

          <div className="border-r border-slate-850 pr-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              OOB Generalization
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">
              {rfMetrics.oobAccuracy}%
            </div>
            <div className="text-[11px] text-slate-400">Out-Of-Bag Cross Val</div>
          </div>

          <div className="border-r border-slate-850 pr-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Training Ledger
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {rfMetrics.trainingSamplesCount} Samples
            </div>
            <div className="text-[11px] text-slate-400">Actual Firebase Logs</div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Early Warning Rule
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1">
              &lt; 75%
            </div>
            <div className="text-[11px] text-slate-400">Debarment Threshold</div>
          </div>
        </div>
      </div>

      {/* Student Prediction Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
            <span>Student Next-Class Predictions</span>
            <span className="text-xs font-normal text-slate-400">(Upcoming Session)</span>
          </h2>
          <span className="text-xs text-slate-400">Evaluated across 7 input feature metrics</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {predictions.map(pred => {
            const isPresent = pred.predictedStatus === 'Present';
            const riskBadge =
              pred.attendanceRisk === 'High'
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : pred.attendanceRisk === 'Medium'
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800';

            return (
              <div
                key={pred.uid}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/50 transition-all p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                        {pred.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-base text-white">{pred.studentName}</div>
                        <div className="text-xs font-mono text-cyan-400">UID: {pred.uid}</div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${riskBadge}`}>
                      {pred.attendanceRisk} Risk
                    </span>
                  </div>

                  {/* Prediction Hero Box */}
                  <div
                    className={`p-4 rounded-xl border mb-4 ${
                      isPresent
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          RF Predicted Status
                        </div>
                        <div className="text-xl font-black flex items-center space-x-1.5 mt-0.5">
                          {isPresent ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-rose-400" />
                          )}
                          <span>{pred.predictedStatus}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Confidence
                        </div>
                        <div className="text-xl font-black font-mono text-white">
                          {pred.confidencePercentage}%
                        </div>
                      </div>
                    </div>

                    {/* Confidence Meter */}
                    <div className="w-full h-1.5 bg-slate-900/80 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full ${isPresent ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        style={{ width: `${pred.confidencePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Attendance Stats Comparison */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Current Attendance</div>
                      <div
                        className={`text-base font-bold ${
                          pred.currentAttendancePercentage < 75 ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {pred.currentAttendancePercentage}%
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Projected Attendance</div>
                      <div
                        className={`text-base font-bold ${
                          pred.projectedAttendancePercentage < 75 ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {pred.projectedAttendancePercentage}%
                      </div>
                    </div>
                  </div>

                  {/* Early Warning Alert */}
                  {pred.earlyWarning && (
                    <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs mb-4 flex items-start space-x-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="leading-snug">{pred.warningMessage}</div>
                    </div>
                  )}

                  {/* Personalized Insights */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
                      Personalized AI Insights
                    </div>
                    {pred.personalizedInsights.map((insight, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5 text-[11px] text-slate-400">
                        <span className="text-violet-400 mt-1">•</span>
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Impacts Pill List */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">
                    Key Drivers (RF Split Deciders):
                  </div>
                  <div className="space-y-1">
                    {pred.featureContributions.slice(0, 3).map((fc, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[150px]">{fc.feature}</span>
                        <span
                          className={`font-semibold ${
                            fc.impact === 'Positive'
                              ? 'text-emerald-400'
                              : fc.impact === 'Negative'
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {fc.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Importance & Interactive Scenario Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Feature Importance (Mean Decrease in Gini) */}
        <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Random Forest Feature Importance
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Relative contribution to Gini impurity reduction across all {rfMetrics.totalTrees} trees.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {rfMetrics.featureImportances.map((item, index) => {
              const pct = Math.round(item.importance * 100);
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">
                      {index + 1}. {item.name}
                    </span>
                    <span className="font-mono text-violet-300 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Algorithm: Gini Impurity Gain (Breiman 2001)</span>
            <span className="font-mono text-cyan-400">OOB: {rfMetrics.oobAccuracy}%</span>
          </div>
        </div>

        {/* Right 6 Cols: Interactive What-If Scenario Simulator */}
        <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Interactive "What-If" Simulator
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Test how the Random Forest classifier responds to simulated parameter changes.
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Student Select */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Select Student Profile</label>
              <select
                value={simStudentUid}
                onChange={e => {
                  const uid = e.target.value;
                  setSimStudentUid(uid);
                  const st = studentStats[uid];
                  if (st) {
                    setSimOverallAttendancePct(st.attendancePercentage);
                    setSimRecentAttendancePct(st.recentAttendanceRate);
                    setSimConsecutiveAbsences(st.consecutiveAbsences);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              >
                {students.map(s => (
                  <option key={s.uid} value={s.uid}>
                    {s.name} (Current: {studentStats[s.uid]?.attendancePercentage ?? 0}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Target Weekday: {['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][simDayOfWeek]}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSimDayOfWeek(d)}
                    className={`py-1.5 rounded-lg font-bold border transition text-[11px] ${
                      simDayOfWeek === d
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Consecutive Absences Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 font-medium">Consecutive Absences</label>
                <span className="font-mono font-bold text-white">{simConsecutiveAbsences}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={simConsecutiveAbsences}
                onChange={e => setSimConsecutiveAbsences(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Overall Attendance Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 font-medium">Overall Attendance Percentage</label>
                <span className="font-mono font-bold text-white">{simOverallAttendancePct}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                step="1"
                value={simOverallAttendancePct}
                onChange={e => setSimOverallAttendancePct(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Live Evaluated Output */}
            <div
              className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between ${
                simResult.predictedClass === 'Present'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Simulated RF Outcome
                </div>
                <div className="text-lg font-extrabold flex items-center space-x-1.5 mt-0.5">
                  {simResult.predictedClass === 'Present' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>Predicted: {simResult.predictedClass}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-medium">Ensemble Votes</div>
                <div className="font-mono text-xs font-bold text-white">
                  {simResult.votesPresent} Present / {simResult.votesAbsent} Absent
                </div>
                <div className="font-mono text-[11px] text-cyan-300">
                  {simResult.confidence}% Confidence
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
