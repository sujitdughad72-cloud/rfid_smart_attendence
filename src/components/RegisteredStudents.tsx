import React, { useState } from 'react';
import {
  Users,
  CreditCard,
  Plus,
  Cpu,
  Mail,
  GraduationCap,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Student, StudentStats } from '../types/attendance';

interface RegisteredStudentsProps {
  students: Student[];
  studentStats: Record<string, StudentStats>;
  onRegisterStudent: (newStudent: Student) => void;
  onSimulateScan: (uid: string) => void;
}

export const RegisteredStudents: React.FC<RegisteredStudentsProps> = ({
  students,
  studentStats,
  onRegisterStudent,
  onSimulateScan
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Student Form state
  const [formName, setFormName] = useState('');
  const [formUid, setFormUid] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formDept, setFormDept] = useState('Computer Science & Engineering');
  const [formEmail, setFormEmail] = useState('');
  const [formSemester, setFormSemester] = useState('6th Semester');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredStudents = students.filter(
    s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUid.trim() || !formRoll.trim()) {
      setErrorMsg('Please fill in Name, RFID UID, and Roll Number.');
      return;
    }

    const cleanUid = formUid.trim().toUpperCase();
    if (students.some(s => s.uid.toLowerCase() === cleanUid.toLowerCase())) {
      setErrorMsg(`A student with RFID UID ${cleanUid} is already registered!`);
      return;
    }

    const colors = [
      'from-blue-600 to-indigo-700',
      'from-emerald-600 to-teal-700',
      'from-purple-600 to-pink-700',
      'from-amber-600 to-orange-700',
      'from-cyan-600 to-blue-700'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newStudent: Student = {
      uid: cleanUid,
      name: formName.trim(),
      rollNumber: formRoll.trim().toUpperCase(),
      department: formDept.trim(),
      email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, '')}@college.edu`,
      semester: formSemester,
      registeredDate: new Date().toISOString().split('T')[0],
      avatarColor: randomColor
    };

    onRegisterStudent(newStudent);
    setIsModalOpen(false);
    // Reset form
    setFormName('');
    setFormUid('');
    setFormRoll('');
    setFormEmail('');
    setErrorMsg('');
  };

  const generateRandomHexUid = () => {
    const chars = '0123456789ABCDEF';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    setFormUid(res);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Users className="w-4 h-4" />
            <span>Cardholder Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Registered RFID Students & Cards
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            MFRC522 Mifare 13.56MHz RFID cards mapped to authenticated student records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name or UID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={() => {
              setErrorMsg('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/30 transition border border-cyan-400/40"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Register Student
          </button>
        </div>
      </div>

      {/* Primary 3 Registered RFID Cards Highlight Notice */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-800/40 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Hardware Pre-Programmed RFID Tags: <strong className="text-white">Raj (16042907)</strong>,{' '}
            <strong className="text-white">Sai (13F97330)</strong>, and{' '}
            <strong className="text-white">Pranav (3ED4D106)</strong>.
          </span>
        </div>
        <span className="text-[11px] text-cyan-400 font-mono">RC522 SPI 13.56 MHz Active</span>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map(student => {
          const stats = studentStats[student.uid];
          const pct = stats?.attendancePercentage ?? 0;
          const isAtRisk = pct < 75;
          const isMediumRisk = pct >= 75 && pct < 82;

          return (
            <div
              key={student.uid}
              className="group relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all p-5 shadow-lg flex flex-col justify-between"
            >
              {/* Virtual RFID Card Representation */}
              <div
                className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${
                  student.avatarColor || 'from-slate-800 to-slate-900'
                } border border-white/10 shadow-inner text-white mb-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-cyan-300" />
                    <span className="text-[10px] font-mono tracking-widest uppercase opacity-80">
                      CAMPUS RFID PASS
                    </span>
                  </div>
                  {/* Microchip graphic */}
                  <div className="w-7 h-5 rounded-md bg-amber-400/90 border border-amber-300/80 shadow-sm flex items-center justify-center">
                    <div className="w-4 h-2.5 border-t border-b border-amber-800/40"></div>
                  </div>
                </div>

                <div className="text-lg font-extrabold tracking-tight mb-1">{student.name}</div>

                <div className="font-mono text-xs text-cyan-200 tracking-wider flex items-center justify-between">
                  <span>UID: {student.uid}</span>
                  <span className="text-[10px] opacity-80">{student.rollNumber}</span>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-200 opacity-90">
                  <span>{student.department}</span>
                  <span>{student.semester}</span>
                </div>
              </div>

              {/* Attendance Performance Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Attendance Ratio</span>
                  <div className="flex items-baseline space-x-1">
                    <span
                      className={`text-lg font-extrabold ${
                        isAtRisk ? 'text-rose-400' : isMediumRisk ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {pct}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({stats?.attendedClasses ?? 0}/{stats?.totalClasses ?? 0})
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isAtRisk ? 'bg-rose-500' : isMediumRisk ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Consecutive Misses</div>
                    <div className="font-bold text-slate-200">
                      {stats?.consecutiveAbsences ?? 0} {stats?.consecutiveAbsences === 1 ? 'class' : 'classes'}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Today's Status</div>
                    <div
                      className={`font-bold ${
                        stats?.statusToday === 'Present'
                          ? 'text-emerald-400'
                          : stats?.statusToday === 'Late'
                          ? 'text-amber-400'
                          : stats?.statusToday === 'Absent'
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {stats?.statusToday ?? 'Not Marked'}
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                {isAtRisk && (
                  <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Below 75% limit - at risk of exam debarment!</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center space-x-2">
                <button
                  onClick={() => onSimulateScan(student.uid)}
                  className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-cyan-600 hover:text-white border border-slate-700 transition flex items-center justify-center space-x-1.5 group-hover:border-cyan-500"
                >
                  <Cpu className="w-3.5 h-3.5 text-cyan-400 group-hover:text-white" />
                  <span>Tap Card (RFID)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register New Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative text-slate-200">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              <span>Enroll New RFID Card</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Map physical RC522 Mifare card UID to a student profile.
            </p>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Sharma"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium">RFID Tag UID (8-char Hex) *</label>
                  <button
                    type="button"
                    onClick={generateRandomHexUid}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Auto-Generate Hex
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5A9C22B1"
                  value={formUid}
                  onChange={e => setFormUid(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS21B099"
                    value={formRoll}
                    onChange={e => setFormRoll(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Semester</label>
                  <select
                    value={formSemester}
                    onChange={e => setFormSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option>4th Semester</option>
                    <option>5th Semester</option>
                    <option>6th Semester</option>
                    <option>7th Semester</option>
                    <option>8th Semester</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Department</label>
                <input
                  type="text"
                  value={formDept}
                  onChange={e => setFormDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  placeholder="student@college.edu"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
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
                  Save & Register Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
