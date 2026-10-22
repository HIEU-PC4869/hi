import React, { useState } from 'react';
import { User } from '../types';

interface Screen0LoginProps {
  onLoginSuccess: (user: User) => void;
  users: User[];
}

export const Screen0Login: React.FC<Screen0LoginProps> = ({ onLoginSuccess, users }) => {
  const [email, setEmail] = useState('a.rivera@university.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoleChip, setSelectedRoleChip] = useState('Student');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both institutional email and password.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Find matching user or fallback to mapped demo user
      const matched = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

      if (matched && password === 'password123') {
        setIsSubmitting(false);
        onLoginSuccess(matched);
      } else if (!matched) {
        // If email not found in mock list, check if it's a student or other role
        let fallbackRole: User['role'] = 'Student';
        if (email.includes('dr.') || email.includes('vance') || email.includes('faculty')) fallbackRole = 'Instructor';
        else if (email.includes('brody') || email.includes('advisor')) fallbackRole = 'Advisor';
        else if (email.includes('admin')) fallbackRole = 'Administrator';

        const customUser: User = {
          id: Math.floor(1000 + Math.random() * 9000),
          email: email.trim(),
          fullName: email.split('@')[0].replace('.', ' ').toUpperCase(),
          role: fallbackRole,
          status: 'Active',
          courses: ['CS-301', 'ENG-204'],
          lastLogin: 'Just now',
        };
        setIsSubmitting(false);
        onLoginSuccess(customUser);
      } else {
        setIsSubmitting(false);
        setErrorMessage('Authentication failed. Please verify credentials (password: password123).');
      }
    }, 600);
  };

  const selectRoleDemo = (roleEmail: string, roleName: string) => {
    setEmail(roleEmail);
    setSelectedRoleChip(roleName);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 relative">
      {/* Ambient frozen glow background elements */}
      <div className="absolute -top-12 -left-12 w-80 h-80 bg-[#7dd3fc]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -right-16 w-96 h-96 bg-[#c8a0f0]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md glacier-card-elevated rounded-2xl p-7 sm:p-9 shadow-2xl transition-all duration-300">
        {/* Top Brand & Hex Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1a2438]/80 border border-[#7dd3fc]/20 shadow-lg shadow-[#7dd3fc]/10 mb-4 group cursor-pointer">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#7dd3fc]/20 via-transparent to-[#c8a0f0]/20 opacity-70"></div>
            <svg
              className="w-8 h-8 text-[#7dd3fc] transition-transform duration-300 group-hover:scale-105"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="9 12 11.5 14.5 15.5 9.5"></polyline>
            </svg>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e4d6e]/40 border border-[#7dd3fc]/20 text-[#7dd3fc] text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7dd3fc] animate-pulse"></span>
            <span>Student Attendance System</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#e0e8f0] tracking-tight">
            Sign in to your Portal
          </h1>
          <p className="text-xs text-[#a0b4c4] mt-1.5 max-w-xs font-normal">
            Select role or provide institutional credentials
          </p>
        </div>

        {/* Error Notification Container (lbl_login_error) */}
        {errorMessage && (
          <div
            id="lbl_login_error"
            className="mb-5 p-3 rounded-lg bg-[#3d1414]/80 border border-[#ff6b6b]/40 text-[#ff6b6b] text-xs flex items-center gap-2.5 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-base shrink-0 text-[#ff6b6b]">
              error
            </span>
            <span className="flex-1 font-medium">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#ff6b6b]/70 hover:text-[#ff6b6b] p-0.5 rounded transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          {/* Institutional Email Field (txt_email) */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-medium text-[#a0b4c4] tracking-wide"
              htmlFor="txt_email"
            >
              Institutional Email
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#a0b4c4]/60 text-lg pointer-events-none">
                school
              </span>
              <input
                id="txt_email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@university.edu"
                className="w-full h-11 pl-11 pr-4 bg-[#1a2438]/60 border border-[#7dd3fc]/15 rounded-lg text-sm text-[#e0e8f0] placeholder:text-[#a0b4c4]/40 focus:outline-none focus:bg-[#1a2438]/90 focus:border-[#7dd3fc]/50 focus:shadow-[0_0_0_2px_rgba(125,211,252,0.35)] transition-all duration-150"
              />
            </div>
          </div>

          {/* Password Field (txt_password) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                className="block text-xs font-medium text-[#a0b4c4] tracking-wide"
                htmlFor="txt_password"
              >
                Password
              </label>
              <button
                type="button"
                className="text-[11px] font-medium text-[#7dd3fc] hover:text-[#c8eaff] transition-colors"
                onClick={() => setPassword('password123')}
              >
                Reset to default
              </button>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#a0b4c4]/60 text-lg pointer-events-none">
                lock_open
              </span>
              <input
                id="txt_password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 pl-11 pr-11 bg-[#1a2438]/60 border border-[#7dd3fc]/15 rounded-lg text-sm text-[#e0e8f0] placeholder:text-[#a0b4c4]/40 focus:outline-none focus:bg-[#1a2438]/90 focus:border-[#7dd3fc]/50 focus:shadow-[0_0_0_2px_rgba(125,211,252,0.35)] transition-all duration-150 tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#a0b4c4]/70 hover:text-[#e0e8f0] p-1 rounded transition-colors focus:outline-none"
                aria-label="Toggle password visibility"
              >
                <span className="material-symbols-outlined text-lg leading-none">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Session verification check */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                defaultChecked
                type="checkbox"
                className="w-4 h-4 rounded bg-[#1a2438] accent-[#7dd3fc] cursor-pointer"
              />
              <span className="text-xs text-[#a0b4c4] group-hover:text-[#e0e8f0] transition-colors select-none">
                Keep verified session
              </span>
            </label>
            <span className="text-[11px] text-[#a0b4c4]/70 font-mono">TLS 1.3 Active</span>
          </div>

          {/* Primary Action: Login (btn_login) */}
          <button
            id="btn_login"
            type="submit"
            disabled={isSubmitting}
            className="relative w-full h-11 mt-2 rounded-lg bg-[#7dd3fc] text-[#001f2e] font-semibold text-sm tracking-wide shadow-lg shadow-[#0e4d6e]/50 hover:bg-[#c8eaff] hover:shadow-[#7dd3fc]/25 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-base">login</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Quick-Select Roles */}
        <div className="mt-7 pt-4 bg-[#1a2438]/20 border border-[#7dd3fc]/10 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[#a0b4c4]">
              Demo Quick Roles
            </span>
            <span className="text-[10px] text-[#c8a0f0] font-mono">One-Click Switch</span>
          </div>
          <div className="grid grid-cols-2 gap-2" id="role_chip_group">
            <button
              type="button"
              onClick={() => selectRoleDemo('a.rivera@university.edu', 'Student')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 ${
                selectedRoleChip === 'Student'
                  ? 'bg-[#1a2438]/90 ring-1 ring-[#7dd3fc]/40 text-[#e0e8f0]'
                  : 'bg-[#1a2438]/40 hover:bg-[#1a2438] text-[#a0b4c4] hover:text-[#e0e8f0]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#7dd3fc] shrink-0"></span>
              <div className="truncate">
                <div className="text-[11px] font-medium leading-tight">Alex Rivera</div>
                <div className="text-[9px] text-[#a0b4c4] leading-tight truncate">Student ID: #24091</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectRoleDemo('dr.vance@university.edu', 'Instructor')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 ${
                selectedRoleChip === 'Instructor'
                  ? 'bg-[#1a2438]/90 ring-1 ring-[#7dd3fc]/40 text-[#e0e8f0]'
                  : 'bg-[#1a2438]/40 hover:bg-[#1a2438] text-[#a0b4c4] hover:text-[#e0e8f0]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8a0f0] shrink-0"></span>
              <div className="truncate">
                <div className="text-[11px] font-medium leading-tight">Dr. Vance</div>
                <div className="text-[9px] text-[#a0b4c4]/80 leading-tight truncate">Faculty / Instructor</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectRoleDemo('m.brody@university.edu', 'Advisor')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 ${
                selectedRoleChip === 'Advisor'
                  ? 'bg-[#1a2438]/90 ring-1 ring-[#7dd3fc]/40 text-[#e0e8f0]'
                  : 'bg-[#1a2438]/40 hover:bg-[#1a2438] text-[#a0b4c4] hover:text-[#e0e8f0]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#88b4cc] shrink-0"></span>
              <div className="truncate">
                <div className="text-[11px] font-medium leading-tight">M. Brody</div>
                <div className="text-[9px] text-[#a0b4c4]/80 leading-tight truncate">Academic Advisor</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectRoleDemo('sysadmin@university.edu', 'Administrator')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 ${
                selectedRoleChip === 'Administrator'
                  ? 'bg-[#1a2438]/90 ring-1 ring-[#7dd3fc]/40 text-[#e0e8f0]'
                  : 'bg-[#1a2438]/40 hover:bg-[#1a2438] text-[#a0b4c4] hover:text-[#e0e8f0]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] shrink-0"></span>
              <div className="truncate">
                <div className="text-[11px] font-medium leading-tight">Sysadmin</div>
                <div className="text-[9px] text-[#a0b4c4]/80 leading-tight truncate">Administrator (Root)</div>
              </div>
            </button>
          </div>
        </div>

        {/* SSO Federated Provider Options */}
        <div className="mt-5 pt-4 bg-[#1a2438]/10 border border-[#7dd3fc]/5 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-medium text-[#a0b4c4]">
              Federated Institutional Sign-In
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#202c42] text-[#c0d8e8]">
              SAML 2.0
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setEmail('a.rivera@university.edu')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#1a2438]/40 hover:bg-[#1a2438]/80 transition-colors group"
            >
              <span className="material-symbols-outlined text-[#7dd3fc] text-xl group-hover:scale-110 transition-transform">
                verified_user
              </span>
              <span className="text-[10px] font-medium text-[#a0b4c4] group-hover:text-[#e0e8f0] mt-1">
                Okta
              </span>
            </button>
            <button
              type="button"
              onClick={() => setEmail('dr.vance@university.edu')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#1a2438]/40 hover:bg-[#1a2438]/80 transition-colors group"
            >
              <span className="material-symbols-outlined text-[#88b4cc] text-xl group-hover:scale-110 transition-transform">
                cloud_sync
              </span>
              <span className="text-[10px] font-medium text-[#a0b4c4] group-hover:text-[#e0e8f0] mt-1">
                Azure AD
              </span>
            </button>
            <button
              type="button"
              onClick={() => setEmail('sysadmin@university.edu')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#1a2438]/40 hover:bg-[#1a2438]/80 transition-colors group"
            >
              <span className="material-symbols-outlined text-[#c8a0f0] text-xl group-hover:scale-110 transition-transform">
                domain
              </span>
              <span className="text-[10px] font-medium text-[#a0b4c4] group-hover:text-[#e0e8f0] mt-1">
                Campus ID
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center space-y-1">
          <p className="text-[10px] text-[#a0b4c4]/60 font-mono">
            Authorized University Staff and Enrolled Students Only
          </p>
        </div>
      </div>
    </div>
  );
};
