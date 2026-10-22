import React from 'react';
import { User } from '../types';

interface HeaderProps {
  currentScreen: number; // 0: Login, 1: Student, 2: Instructor, 3: Advisor, 4: Admin
  onSelectScreen: (screen: number) => void;
  currentUser: User | null;
  onOpenPythonModal: () => void;
  onOpenHtmlGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onSelectScreen,
  currentUser,
  onOpenPythonModal,
  onOpenHtmlGuide,
}) => {
  const pages = [
    { id: 0, label: '0: Login' },
    { id: 1, label: '1: Student' },
    { id: 2, label: '2: Instructor' },
    { id: 3, label: '3: Advisor' },
    { id: 4, label: '4: Admin' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f1524]/80 backdrop-blur-2xl border-b border-[#7dd3fc]/10 shadow-[0_1px_12px_rgba(0,0,0,0.35)]">
      <div className="h-20 w-full px-6 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1a2438] border border-[#7dd3fc]/20 shadow-lg text-[#7dd3fc]">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[#e0e8f0] leading-tight">
              SAS Enterprise
            </span>
            <span className="text-xs text-[#a0b4c4] tracking-normal">
              Student Attendance & Intelligence
            </span>
          </div>
        </div>

        {/* Center Nav bar */}
        <div className="flex items-center gap-3 flex-1 justify-center max-w-3xl">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141c2e]/60 border border-[#7dd3fc]/10 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-[#a0b4c4] font-medium">HTML & Web Ready</span>
          </div>

          <nav className="flex items-center p-1 rounded-xl bg-[#111828]/80 border border-[#7dd3fc]/10 backdrop-blur-md">
            {pages.map((p) => {
              const isActive = currentScreen === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectScreen(p.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#0e4d6e] text-[#c8eaff] font-semibold shadow-inner'
                      : 'text-[#a0b4c4] hover:bg-[#1a2438] hover:text-[#e0e8f0]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </nav>

          {/* HTML Standalone Guide button */}
          <button
            onClick={onOpenHtmlGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e4d6e] hover:bg-[#7dd3fc] text-[#c8eaff] hover:text-[#001f2e] border border-[#7dd3fc]/40 text-xs font-bold shadow-md transition-all active:scale-95"
            title="Chạy bản HTML trực tiếp trên VS Code không cần cài đặt"
          >
            <span className="material-symbols-outlined text-sm">html</span>
            <span>Bản HTML (VS Code)</span>
          </button>

          {/* Python Architecture button */}
          <button
            onClick={onOpenPythonModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3d2060]/70 hover:bg-[#3d2060] text-[#c8a0f0] border border-[#c8a0f0]/30 text-xs font-semibold shadow-md transition-all active:scale-95"
            title="Inspect Python PySide6 Source Code"
          >
            <span className="material-symbols-outlined text-sm">code</span>
            <span>PySide6 Code</span>
          </button>
        </div>

        {/* User profile & Notification */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            className="relative p-2 rounded-xl text-[#a0b4c4] hover:bg-[#141c2e] hover:text-[#e0e8f0] transition-colors"
            type="button"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-xl leading-none">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#7dd3fc]"></span>
          </button>

          <div className="flex items-center gap-3 pl-2">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#7dd3fc]/30"
              src={
                currentUser?.avatarUrl ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAzH-7fzikK9qt-ALvc2g0BvjVT5Gp3inTEebEwIS0MvJ72EFbi-yxgtfI262r-fA3Vet-2f3WoJHp1rNvURCxECc7eAQ7zvCSilEUSPfw2UyM5s3MjBiOh8Znl64IunmkvmyRd_oacy99NeT-VqE_UJVYb1WXTU-ZEpf-g4iBEHh-Hybcxi9vlinYBxOFga2qSlovHKVMhDjxSgctnUyaMZK-SCs4Jp59aZLnNsg0NzRszWEh--3Yu'
              }
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#e0e8f0] leading-snug">
                {currentUser?.fullName || 'Dr. Evelyn Vance'}
              </span>
              <span className="text-[11px] text-[#a0b4c4] leading-none">
                {currentUser ? `${currentUser.role} • Univ` : 'Metropolitan University'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
