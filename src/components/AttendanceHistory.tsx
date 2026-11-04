import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  Radio,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AttendanceRecord, Student, AttendanceStatus } from '../types/attendance';

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  students: Student[];
  onAddManualRecord: (record: AttendanceRecord) => void;
  onExportCSV: () => void;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  records,
  students,
  onAddManualRecord,
  onExportCSV
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentUid, setSelectedStudentUid] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Manual Punch Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualUid, setManualUid] = useState(students[0]?.uid || '16042907');
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('Present');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('09:00:00');

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        record.studentName.toLowerCase().includes(searchLower) ||
        record.uid.toLowerCase().includes(searchLower);

      // Student filter
      const matchStudent = selectedStudentUid === 'ALL' || record.uid === selectedStudentUid;

      // Status filter
      const matchStatus = selectedStatus === 'ALL' || record.status === selectedStatus;

      // Date filter
      const matchDate = !dateFilter || record.date === dateFilter;

      return matchSearch && matchStudent && matchStatus && matchDate;
    });
  }, [records, searchTerm, selectedStudentUid, selectedStatus, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = students.find(s => s.uid === manualUid);
    const studentName = matched ? matched.name : 'Unknown Student';

    const timestampStr = `${manualDate}T${manualTime}`;
    const dateObj = new Date(timestampStr);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const newRecord: AttendanceRecord = {
      id: `manual-${Date.now()}`,
      uid: manualUid,
      studentName,
      status: manualStatus,
      timestamp: dateObj.toISOString(),
      date: manualDate,
      dayOfWeek: dayNames[dateObj.getDay()],
      time: manualTime,
      deviceId: 'ADMIN_MANUAL_TERMINAL',
      verifiedVia: 'MANUAL_OVERRIDE'
    };

    onAddManualRecord(newRecord);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <History className="w-4 h-4" />
            <span>Attendance Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Historical Attendance Logs & Audits
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Synchronized directly from Firebase Realtime Database path <code className="text-cyan-300 font-mono">/attendance</code>.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onExportCSV}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Export CSV
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/30 transition border border-cyan-400/40"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Punch Log
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Student or UID..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Student Filter */}
          <div>
            <select
              value={selectedStudentUid}
              onChange={e => {
                setSelectedStudentUid(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Students (Raj, Sai, Pranav...)</option>
              {students.map(s => (
                <option key={s.uid} value={s.uid}>
                  {s.name} ({s.uid})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Attendance Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Late">Late Only</option>
              <option value="Absent">Absent Only</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateFilter}
              onChange={e => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                title="Clear Date"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>
            Showing <strong className="text-white">{filteredRecords.length}</strong> of{' '}
            <strong className="text-slate-300">{records.length}</strong> total records
          </span>
          <span className="font-mono text-[11px] text-cyan-400">
            Realtime DB /attendance
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5 font-mono">RFID UID</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Date & Day</th>
                <th className="px-4 py-3.5">Punch Time</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-4 py-3.5 font-mono">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(record => {
                  const isPresent = record.status === 'Present';
                  const isLate = record.status === 'Late';
                  const isAbsent = record.status === 'Absent';

                  const badgeClass = isPresent
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : isLate
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800';

                  return (
                    <tr key={record.id} className="hover:bg-slate-800/50 transition">
                      {/* Student Name */}
                      <td className="px-4 py-3 font-semibold text-white flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-md bg-slate-800 text-cyan-300 flex items-center justify-center font-bold text-[10px] border border-slate-700">
                          {record.studentName.charAt(0)}
                        </div>
                        <span>{record.studentName}</span>
                      </td>

                      {/* UID */}
                      <td className="px-4 py-3 font-mono font-medium text-cyan-300">
                        {record.uid}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                          {isPresent && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {isLate && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {isAbsent && <XCircle className="w-3 h-3 mr-1" />}
                          {record.status}
                        </span>
                      </td>

                      {/* Date & Day */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{record.date}</div>
                        <div className="text-[10px] text-slate-400">{record.dayOfWeek}</div>
                      </td>

                      {/* Punch Time */}
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {record.time}
                      </td>

                      {/* Verification Mode */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          <Radio className="w-2.5 h-2.5 mr-1 text-cyan-400" />
                          {record.verifiedVia}
                        </span>
                      </td>

                      {/* ISO Timestamp */}
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 truncate max-w-[140px]" title={record.timestamp}>
                        {record.timestamp}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Punch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative text-slate-200">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Record Manual Attendance Punch</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Add a verified entry to the attendance ledger (e.g., excused leave or hardware backup).
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Student *</label>
                <select
                  value={manualUid}
                  onChange={e => setManualUid(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  {students.map(s => (
                    <option key={s.uid} value={s.uid}>
                      {s.name} (UID: {s.uid} - {s.rollNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Attendance Status *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Present', 'Late', 'Absent'] as AttendanceStatus[]).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setManualStatus(status)}
                      className={`py-2 rounded-xl font-bold border transition ${
                        manualStatus === status
                          ? status === 'Present'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : status === 'Late'
                            ? 'bg-amber-950 text-amber-300 border-amber-500'
                            : 'bg-rose-950 text-rose-300 border-rose-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Date *</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Time *</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={manualTime}
                    onChange={e => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-md shadow-cyan-600/30"
                >
                  Commit Attendance Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
