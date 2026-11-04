import React from 'react';
import {
  LayoutDashboard,
  Users,
  Radio,
  History,
  BrainCircuit,
  ShieldAlert,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export type TabKey =
  | 'overview'
  | 'students'
  | 'live-rfid'
  | 'history'
  | 'ai-prediction'
  | 'risk-analysis'
  | 'analytics'
  | 'export';

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  atRiskCount: number;
  totalRecordsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  atRiskCount,
  totalRecordsCount
}) => {
  const navItems: {
    id: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
    description: string;
  }[] = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      description: 'System metrics & live activity'
    },
    {
      id: 'students',
      label: 'Registered Students',
      icon: Users,
      badge: 3,
      badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
      description: 'Raj, Sai, Pranav & RFID cards'
    },
    {
      id: 'live-rfid',
      label: 'Live RFID Attendance',
      icon: Radio,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800 animate-pulse',
      description: 'ESP32 reader & tap simulator'
    },
    {
      id: 'history',
      label: 'Attendance History',
      icon: History,
      badge: totalRecordsCount,
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      description: 'Complete attendance records'
    },
    {
      id: 'ai-prediction',
      label: 'AI Attendance Prediction',
      icon: BrainCircuit,
      badge: 'RF ML',
      badgeColor: 'bg-violet-950 text-violet-300 border-violet-800',
      description: 'Random Forest next-class forecast'
    },
    {
      id: 'risk-analysis',
      label: 'Student Risk Analysis',
      icon: ShieldAlert,
      badge: atRiskCount > 0 ? `${atRiskCount} Alert` : 'Safe',
      badgeColor:
        atRiskCount > 0
          ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
          : 'bg-emerald-950 text-emerald-300 border-emerald-800',
      description: '75% compliance & warnings'
    },
    {
      id: 'analytics',
      label: 'Attendance Analytics',
      icon: BarChart3,
      description: 'Charts & day-of-week trends'
    },
    {
      id: 'export',
      label: 'Export Reports',
      icon: FileSpreadsheet,
      badge: 'CSV/XLS',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
      description: 'Download CSV & Excel reports'
    }
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900/60 lg:min-h-[calc(100vh-4rem)] border-b lg:border-b-0 lg:border-r border-slate-800 p-3 sm:p-4 shrink-0">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
        <span>Navigation Modules</span>
        <span className="text-slate-500 font-mono">v2.4-ESP32</span>
      </div>

      <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 via-blue-950/60 to-slate-800/90 text-cyan-300 border border-cyan-700/60 shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <div className="truncate">
                  <div className="font-semibold text-xs sm:text-sm truncate leading-snug">{item.label}</div>
                  <div className="text-[11px] text-slate-500 truncate hidden lg:block leading-none mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex items-center space-x-1.5 shrink-0 ml-2">
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Warning Callout Box for Students <75% */}
      {atRiskCount > 0 && (
        <div className="mt-6 hidden lg:block p-3 rounded-xl bg-gradient-to-br from-rose-950/40 to-slate-900 border border-rose-800/50">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Attendance Warning</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <span className="font-semibold text-rose-300">{atRiskCount} student</span> requires immediate intervention to satisfy the university 75% rule.
          </p>
          <button
            onClick={() => onSelectTab('risk-analysis')}
            className="mt-2 w-full py-1 text-[11px] font-semibold text-rose-300 bg-rose-900/30 hover:bg-rose-900/50 rounded-lg border border-rose-700/50 transition text-center"
          >
            Review At-Risk Students →
          </button>
        </div>
      )}
    </aside>
  );
};
