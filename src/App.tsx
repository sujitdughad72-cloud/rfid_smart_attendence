import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Student,
  AttendanceRecord,
  StudentStats,
  AIPredictionResult,
  RiskAnalysisItem,
  RandomForestMetrics,
  FirebaseConnectionConfig
} from './types/attendance';
import { StorageService } from './services/storageService';
import {
  RandomForestClassifier,
  buildTrainingSamplesFromRecords,
  predictStudentNextClass
} from './services/randomForest';
import { firebaseService } from './services/firebaseService';
import { soundManager } from './utils/audio';

import { Navbar } from './components/Navbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { RegisteredStudents } from './components/RegisteredStudents';
import { LiveRFIDScanner } from './components/LiveRFIDScanner';
import { AttendanceHistory } from './components/AttendanceHistory';
import { AIPrediction } from './components/AIPrediction';
import { StudentRiskAnalysis } from './components/StudentRiskAnalysis';
import { AttendanceAnalytics } from './components/AttendanceAnalytics';
import { ExportReports } from './components/ExportReports';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { ESP32CodeModal } from './components/ESP32CodeModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabKey>('overview');
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [records, setRecords] = useState<AttendanceRecord[]>(() => StorageService.getRecords());
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConnectionConfig>(() =>
    firebaseService.getConfig()
  );

  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isEsp32ModalOpen, setIsEsp32ModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);

  // Initialize Random Forest Classifier
  const rfModel = useMemo(() => new RandomForestClassifier(21, 5, 2), []);
  const [rfMetrics, setRfMetrics] = useState<RandomForestMetrics>({
    totalTrees: 21,
    trainingSamplesCount: 0,
    oobAccuracy: 89.2,
    featureImportances: [],
    treeDepths: [],
    lastTrainedAt: new Date().toISOString()
  });

  // Calculate student stats from records
  const studentStats = useMemo(() => {
    return StorageService.calculateStudentStats(students, records);
  }, [students, records]);

  // Calculate 75% risk analysis items
  const riskItems = useMemo(() => {
    return StorageService.calculateRiskAnalysis(studentStats);
  }, [studentStats]);

  const atRiskCount = useMemo(() => {
    return riskItems.filter(r => r.riskLevel === 'High').length;
  }, [riskItems]);

  // Train Random Forest model whenever records change
  const trainModel = useCallback(() => {
    setIsRetraining(true);
    setTimeout(() => {
      const trainingSamples = buildTrainingSamplesFromRecords(records, studentStats);
      const metrics = rfModel.train(trainingSamples);
      setRfMetrics(metrics);
      setIsRetraining(false);
    }, 250);
  }, [records, studentStats, rfModel]);

  useEffect(() => {
    trainModel();
  }, [trainModel]);

  // Generate AI predictions for next class
  const predictions: AIPredictionResult[] = useMemo(() => {
    const today = new Date();
    // Default to next weekday (e.g., if today is Fri, next is Mon)
    let nextDay = today.getDay() + 1;
    if (nextDay > 5 || nextDay === 0) nextDay = 1; // 1 = Monday

    return students.map(student => {
      const stats = studentStats[student.uid];
      if (!stats) {
        return {
          uid: student.uid,
          studentName: student.name,
          predictedStatus: 'Present',
          confidencePercentage: 85,
          attendanceRisk: 'Low',
          currentAttendancePercentage: 100,
          projectedAttendancePercentage: 100,
          personalizedInsights: ['New enrollee with clean record.'],
          earlyWarning: false,
          featureContributions: []
        };
      }
      return predictStudentNextClass(stats, nextDay, rfModel);
    });
  }, [students, studentStats, rfModel, rfMetrics]);

  // Handle new RFID scan (simulated, physical USB keyboard wedge, or live gate)
  const handleScanUID = useCallback(
    async (uid: string, customStatus?: 'Present' | 'Late') => {
      const cleanUid = uid.trim().toUpperCase();
      const matched = students.find(s => s.uid.toLowerCase() === cleanUid.toLowerCase());
      const studentName = matched ? matched.name : 'Unregistered Visitor';

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[now.getDay()];

      const newRecord: AttendanceRecord = {
        id: `rfid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        uid: cleanUid,
        studentName,
        status: customStatus || 'Present',
        timestamp: now.toISOString(),
        date: dateStr,
        dayOfWeek: dayName,
        time: timeStr,
        deviceId: 'ESP32_RC522_GATE_01',
        verifiedVia: 'RFID_RC522'
      };

      // Sound feedback
      soundManager.playRfidBeep();

      // Confetti celebrate if student was at risk or maintaining 100%
      if (matched) {
        const stats = studentStats[matched.uid];
        if (stats && stats.attendancePercentage >= 95) {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.8 }
          });
        }
      }

      // Save locally
      const updatedRecords = StorageService.addRecord(newRecord);
      setRecords(updatedRecords);

      // Push to Firebase Realtime Database in background
      try {
        await firebaseService.pushAttendanceRecord(newRecord);
      } catch (err) {
        console.warn('Firebase RTDB push error', err);
      }
    },
    [students, studentStats]
  );

  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(new Date());
  const [rawCount, setRawCount] = useState<number>(0);
  const [newScanAlert, setNewScanAlert] = useState<{ name: string; uid: string; status: string; time: string } | null>(null);

  // Sync with Firebase Realtime Database
  const handleSyncFirebase = useCallback(async (isAutoPoll: boolean = false) => {
    if (!isAutoPoll) setIsSyncing(true);
    try {
      const res = await firebaseService.fetchAttendanceRecords();
      if (res.success && res.records.length > 0) {
        setRawCount(res.rawCount || res.records.length);
        setLastFetchedAt(new Date());

        setRecords(prevRecords => {
          const existingIds = new Set(prevRecords.map(r => r.id));
          const newOnes = res.records.filter(r => !existingIds.has(r.id));

          if (newOnes.length > 0) {
            // New physical sensor scan detected!
            const latestOne = newOnes[0];
            soundManager.playRfidBeep();
            setNewScanAlert({
              name: latestOne.studentName,
              uid: latestOne.uid,
              status: latestOne.status,
              time: latestOne.time
            });
            setTimeout(() => setNewScanAlert(null), 5000);

            const merged = [...newOnes, ...prevRecords].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            StorageService.saveRecords(merged);
            return merged;
          }
          return prevRecords;
        });
      }
      setFirebaseConfig(firebaseService.getConfig());
    } catch (e) {
      console.warn('Firebase RTDB sync warning', e);
    } finally {
      if (!isAutoPoll) setIsSyncing(false);
    }
  }, []);

  // Initial fetch and continuous 3-second live sensor polling
  useEffect(() => {
    handleSyncFirebase(false);

    const interval = setInterval(() => {
      handleSyncFirebase(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [handleSyncFirebase]);

  // Add manual record
  const handleAddManualRecord = (record: AttendanceRecord) => {
    const updated = StorageService.addRecord(record);
    setRecords(updated);
    firebaseService.pushAttendanceRecord(record).catch(() => {});
    soundManager.playRfidBeep();
  };

  // Register new student
  const handleRegisterStudent = (newStudent: Student) => {
    const updated = StorageService.registerStudent(newStudent);
    setStudents(updated);
    soundManager.playSuccessChime();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative">
      {/* Realtime Sensor Detection Toast */}
      {newScanAlert && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-500/20 text-white animate-bounce flex items-center space-x-3 max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center shrink-0">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="truncate">
            <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              Live Sensor Reading Captured!
            </div>
            <div className="font-extrabold text-sm text-white">
              {newScanAlert.name} <span className="font-mono text-cyan-300 font-medium">({newScanAlert.uid})</span>
            </div>
            <div className="text-xs text-slate-400">
              Status: <span className="text-emerald-400 font-bold">{newScanAlert.status}</span> • {newScanAlert.time}
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        firebaseConfig={firebaseConfig}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenEsp32Modal={() => setIsEsp32ModalOpen(true)}
        onQuickScanClick={() => setCurrentTab('live-rfid')}
        onSyncFirebase={() => handleSyncFirebase(false)}
        isSyncing={isSyncing}
        totalStudents={students.length}
      />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          atRiskCount={atRiskCount}
          totalRecordsCount={records.length}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'overview' && (
            <DashboardOverview
              students={students}
              records={records}
              studentStats={studentStats}
              predictions={predictions}
              rfMetrics={rfMetrics}
              firebaseConfig={firebaseConfig}
              onSelectTab={setCurrentTab}
              onSimulateRfidScan={handleScanUID}
              onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
              onRetrainModel={trainModel}
              isRetraining={isRetraining}
              onRefreshLiveSensor={() => handleSyncFirebase(false)}
              isPolling={true}
              lastFetchedAt={lastFetchedAt}
              rawCount={rawCount}
            />
          )}

          {currentTab === 'students' && (
            <RegisteredStudents
              students={students}
              studentStats={studentStats}
              onRegisterStudent={handleRegisterStudent}
              onSimulateScan={handleScanUID}
            />
          )}

          {currentTab === 'live-rfid' && (
            <LiveRFIDScanner
              students={students}
              records={records}
              firebaseConfig={firebaseConfig}
              onScanUID={handleScanUID}
              onOpenEsp32Modal={() => setIsEsp32ModalOpen(true)}
              onRefreshLiveSensor={() => handleSyncFirebase(false)}
              isPolling={true}
              rawCount={rawCount}
            />
          )}

          {currentTab === 'history' && (
            <AttendanceHistory
              records={records}
              students={students}
              onAddManualRecord={handleAddManualRecord}
              onExportCSV={() => setCurrentTab('export')}
            />
          )}

          {currentTab === 'ai-prediction' && (
            <AIPrediction
              students={students}
              studentStats={studentStats}
              predictions={predictions}
              rfMetrics={rfMetrics}
              rfModel={rfModel}
              onRetrainModel={trainModel}
              isRetraining={isRetraining}
            />
          )}

          {currentTab === 'risk-analysis' && (
            <StudentRiskAnalysis
              students={students}
              studentStats={studentStats}
              riskItems={riskItems}
              onExportRiskCSV={() => setCurrentTab('export')}
            />
          )}

          {currentTab === 'analytics' && (
            <AttendanceAnalytics
              students={students}
              studentStats={studentStats}
              records={records}
            />
          )}

          {currentTab === 'export' && (
            <ExportReports
              records={records}
              riskItems={riskItems}
              predictions={predictions}
            />
          )}
        </main>
      </div>

      {/* Firebase RTDB Settings Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        config={firebaseConfig}
        onSaveConfig={cfg => {
          const updated = firebaseService.saveConfig(cfg);
          setFirebaseConfig(updated);
        }}
        onSync={handleSyncFirebase}
        isSyncing={isSyncing}
      />

      {/* ESP32 Arduino Firmware Modal */}
      <ESP32CodeModal
        isOpen={isEsp32ModalOpen}
        onClose={() => setIsEsp32ModalOpen(false)}
        databaseUrl={firebaseConfig.databaseURL}
      />
    </div>
  );
}
