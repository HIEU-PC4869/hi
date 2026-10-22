import React from 'react';

interface SidebarProps {
  currentScreen: number;
  onSelectScreen: (screen: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onSelectScreen }) => {
  const navItems = [
    { screen: 2, label: 'Instructor Workspace', icon: 'co_present' },
    { screen: 1, label: 'Student Portal', icon: 'school' },
    { screen: 3, label: 'Advisor Hub', icon: 'assignment_ind' },
    { screen: 4, label: 'Admin Console', icon: 'admin_panel_settings' },
    { screen: 1, label: 'Attendance Analytics', icon: 'monitoring' },
    { screen: 4, label: 'Audit Logs', icon: 'history_toggle_off' },
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
          return (
            <button
              key={idx}
              onClick={() => onSelectScreen(item.screen)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#0e4d6e] text-[#c8eaff] font-semibold shadow-sm'
                  : 'text-[#a0b4c4] hover:bg-[#1a2438] hover:text-[#e0e8f0]'
              }`}
            >
              <span className="material-symbols-outlined text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Session Secured badge */}
      <div className="px-4 mt-auto">
        <div className="p-3.5 rounded-xl bg-[#141c2e]/60 border border-[#7dd3fc]/10 backdrop-blur-md flex items-center gap-3">
          <span className="material-symbols-outlined text-[#7dd3fc] text-lg">verified_user</span>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-semibold text-[#e0e8f0]">Session Secured</span>
            <span className="text-[10px] text-[#a0b4c4]">Hardware Token Valid</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
