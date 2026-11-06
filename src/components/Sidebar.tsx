import React from 'react';
import { canAccessScreen } from '../utils/rbac';

interface SidebarProps {
  currentScreen: number;
  onSelectScreen: (screen: number) => void;
  currentUserRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  currentUserRole = 'Student',
}) => {
  const navItems = [
    { screen: 1, label: 'Student Portal', icon: 'school' },
    { screen: 2, label: 'Instructor Workspace', icon: 'co_present' },
    { screen: 3, label: 'Advisor Hub', icon: 'assignment_ind' },
    { screen: 4, label: 'Admin Console', icon: 'admin_panel_settings' },
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#111828]/70 border-r border-[#7dd3fc]/10 backdrop-blur-2xl z-40 flex-col pt-24 pb-6 shadow-[1px_0_12px_rgba(0,0,0,0.25)]">
      <div className="px-6 mb-6">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#a0b4c4]/70">
          Navigation Core
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          const isActive = currentScreen === item.screen;
          const isAllowed = canAccessScreen(currentUserRole, item.screen);
          return (
            <button
              key={idx}
              onClick={() => onSelectScreen(item.screen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#0e4d6e] text-[#c8eaff] font-semibold shadow-sm'
                  : isAllowed
                  ? 'text-[#a0b4c4] hover:bg-[#1a2438] hover:text-[#e0e8f0]'
                  : 'text-[#a0b4c4]/40 hover:bg-[#1a2438]/50 cursor-not-allowed opacity-50'
              }`}
              title={isAllowed ? item.label : `Restricted: Role [${currentUserRole}] cannot access`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {!isAllowed && (
                <span className="material-symbols-outlined text-xs text-amber-400">lock</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Session Secured badge */}
      <div className="px-4 mt-auto space-y-2">
        <div className="p-3.5 rounded-xl bg-[#141c2e]/60 border border-emerald-500/20 backdrop-blur-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span className="text-[11px] font-semibold">HTTPS Strict</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">TLS 1.3</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#a0b4c4]">
            <span>Security Policy:</span>
            <span className="text-emerald-400 font-mono">HSTS & CSP</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#a0b4c4]">
            <span>Active Role:</span>
            <span className="text-[#7dd3fc] font-mono font-medium">{currentUserRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
