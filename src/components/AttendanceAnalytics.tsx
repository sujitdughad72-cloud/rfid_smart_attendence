import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Student, StudentStats, AttendanceRecord } from '../types/attendance';

interface AttendanceAnalyticsProps {
  students: Student[];
  studentStats: Record<string, StudentStats>;
  records: AttendanceRecord[];
}

export const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({
  students,
  studentStats,
  records
}) => {
  // 1. Day of the week aggregated presence
  const dayStats: Record<string, { total: number; attended: number }> = {
    Monday: { total: 0, attended: 0 },
    Tuesday: { total: 0, attended: 0 },
    Wednesday: { total: 0, attended: 0 },
    Thursday: { total: 0, attended: 0 },
    Friday: { total: 0, attended: 0 }
  };

  for (const r of records) {
    if (dayStats[r.dayOfWeek]) {
      dayStats[r.dayOfWeek].total++;
      if (r.status === 'Present' || r.status === 'Late') {
        dayStats[r.dayOfWeek].attended++;
      }
    }
  }

  // 2. Chronological session daily rates (last 14 class days)
  const dateGroups: Record<string, { total: number; attended: number; dayName: string }> = {};
  const sortedChronological = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const r of sortedChronological) {
    if (!dateGroups[r.date]) {
      dateGroups[r.date] = { total: 0, attended: 0, dayName: r.dayOfWeek };
    }
    dateGroups[r.date].total++;
    if (r.status === 'Present' || r.status === 'Late') {
      dateGroups[r.date].attended++;
    }
  }

  const recentDates = Object.keys(dateGroups).slice(-14);

  // 3. Punctuality stats
  let onTimeCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  for (const r of records) {
    if (r.status === 'Present') onTimeCount++;
    else if (r.status === 'Late') lateCount++;
    else if (r.status === 'Absent') absentCount++;
  }

  const totalEntries = records.length || 1;
  const onTimePct = Math.round((onTimeCount / totalEntries) * 100);
  const latePct = Math.round((lateCount / totalEntries) * 100);
  const absentPct = Math.round((absentCount / totalEntries) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>Cohort Analytics & Patterns</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Attendance Analytics & Day-of-Week Trends
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Empirical patterns extracted from verified RFID hardware logs across the academic semester.
        </p>
      </div>

      {/* Top 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">On-Time Punch Ratio</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{onTimePct}%</div>
          <div className="text-xs text-slate-400 mt-1">{onTimeCount} Punctual check-ins</div>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Late Arrivals (Post 09:15)</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{latePct}%</div>
          <div className="text-xs text-slate-400 mt-1">{lateCount} Late tap logs</div>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Missed Sessions (Absent)</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{absentPct}%</div>
          <div className="text-xs text-slate-400 mt-1">{absentCount} Unattended classes</div>
        </div>
      </div>

      {/* Primary Chart 1: Student Attendance vs 75% Cutoff Line */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Student Attendance Comparison vs 75% Mandate
            </h2>
            <p className="text-xs text-slate-400">
              Benchmark against the red mandatory university eligibility threshold.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
              Above 75% (Eligible)
            </span>
            <span className="flex items-center text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5" />
              Below 75% (Critical)
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="space-y-4">
          {students.map(student => {
            const stats = studentStats[student.uid];
            const pct = stats?.attendancePercentage ?? 0;
            const isBelow75 = pct < 75;

            return (
              <div key={student.uid} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{student.name}</span>
                    <span className="font-mono text-cyan-400 text-[11px]">({student.uid})</span>
                  </div>
                  <span
                    className={`font-mono font-extrabold text-sm ${
                      isBelow75 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {pct}%{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({stats?.attendedClasses ?? 0}/{stats?.totalClasses ?? 0} classes)
                    </span>
                  </span>
                </div>

                <div className="relative w-full h-6 bg-slate-950 rounded-xl overflow-hidden p-0.5 border border-slate-800">
                  {/* 75% Reference Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 shadow-sm shadow-rose-500"
                    style={{ left: '75%' }}
                    title="75% Mandatory Cutoff"
                  >
                    <div className="absolute -top-1 -left-2 text-[8px] font-mono text-rose-400 bg-slate-900 px-0.5 rounded">
                      75%
                    </div>
                  </div>

                  {/* Filled Bar */}
                  <div
                    className={`h-full rounded-lg transition-all duration-700 ${
                      isBelow75
                        ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Day of Week Heatmap + Recent Class Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day-of-Week Attendance Heatmap */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Weekday Attendance Patterns</span>
          </div>
          <h2 className="text-sm font-bold text-white mb-1">
            Day-of-Week Consistency Breakdown
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Identifies specific weekdays with recurrent absentee tendencies (e.g., Friday drop-offs).
          </p>

          <div className="space-y-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
              const data = dayStats[day] || { total: 0, attended: 0 };
              const rate = data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0;
              const isLowDay = rate < 75;

              return (
                <div key={day} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{day}</span>
                    <span className={`font-mono font-bold ${isLowDay ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {rate}% <span className="text-slate-500 font-normal">({data.attended}/{data.total})</span>
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLowDay
                          ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>ML Feature Insight:</strong> Weekday patterns directly feed into feature #6 of the Random Forest model to predict weekday-specific absences.
            </span>
          </div>
        </div>

        {/* Recent Class Trajectory (Last 14 Sessions) */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Session-by-Session Timeline</span>
          </div>
          <h2 className="text-sm font-bold text-white mb-1">
            Attendance Rate Over Past 14 Class Days
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Percentage of registered students present for each scheduled lecture date.
          </p>

          <div className="h-44 flex items-end justify-between gap-1.5 pt-6 pb-2 border-b border-slate-800">
            {recentDates.map(dateKey => {
              const d = dateGroups[dateKey];
              const pct = d.total > 0 ? Math.round((d.attended / d.total) * 100) : 0;
              const isShort = pct < 75;

              return (
                <div key={dateKey} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-800 text-white text-[10px] font-mono py-0.5 px-1.5 rounded border border-slate-700 whitespace-nowrap z-20">
                    {dateKey}: {pct}% ({d.attended}/{d.total})
                  </div>

                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isShort ? 'bg-amber-500/80 group-hover:bg-amber-400' : 'bg-cyan-500/80 group-hover:bg-cyan-400'
                    }`}
                    style={{ height: `${Math.max(12, pct)}%` }}
                  />
                  <span className="text-[9px] font-mono text-slate-500 mt-1 truncate max-w-full">
                    {dateKey.split('-').slice(1).join('/')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-cyan-400 mr-1.5" />
              Cohort rate &gt;= 75%
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
              Cohort rate &lt; 75%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
