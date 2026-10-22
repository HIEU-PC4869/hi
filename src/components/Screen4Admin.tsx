import React, { useState } from 'react';
import { User, AuditLogItem } from '../types';

interface Screen4AdminProps {
  users: User[];
  auditLogs: AuditLogItem[];
  onAddUser: (email: string, role: User['role'], department?: string) => void;
  onDeleteUser: (userId: number) => void;
  onExportSystemReport: () => void;
}

export const Screen4Admin: React.FC<Screen4AdminProps> = ({
  users,
  auditLogs,
  onAddUser,
  onDeleteUser,
  onExportSystemReport,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<User['role']>('Student');
  const [newDepartment, setNewDepartment] = useState('Dept. of Computer Science');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | User['role']>('all');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [addNotice, setAddNotice] = useState<string | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('Please enter a valid institutional email address.');
      return;
    }

    onAddUser(newEmail.trim(), newRole, newDepartment);
    setAddNotice(`Provisioned identity: ${newEmail.trim()} as ${newRole}.`);
    setNewEmail('');
    setTimeout(() => setAddNotice(null), 4000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      !searchQuery ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.id).includes(searchQuery);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="w-full space-y-8">
      {/* Governance Engine Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#141c2e]/70 border border-[#7dd3fc]/15 backdrop-blur-2xl p-7 shadow-2xl">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#7dd3fc]/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#c8a0f0]/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#7dd3fc]/10 text-[#7dd3fc] border border-[#7dd3fc]/20">
                <span className="material-symbols-outlined text-lg leading-none">
                  admin_panel_settings
                </span>
              </span>
              <span className="text-xs font-semibold tracking-wider uppercase text-[#88b4cc]">
                Governance Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#e0e8f0]">
              System Administration & Governance
            </h1>
            <p className="text-sm text-[#a0b4c4] max-w-2xl leading-relaxed">
              User lifecycle management, role-based access control (RBAC), security policies, and
              institutional audit compliance exports.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-[#1a2438] hover:bg-[#202c42] border border-[#7dd3fc]/20 text-[#c8a0f0] text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">history_toggle_off</span>
              <span>View Audit Logs</span>
            </button>

            <button
              id="btn_export_system_report"
              onClick={onExportSystemReport}
              className="px-4 py-2.5 rounded-xl bg-[#1a2438]/90 hover:bg-[#202c42] border border-[#7dd3fc]/20 text-[#e0e8f0] text-xs font-medium tracking-wide transition-all duration-200 flex items-center gap-2.5 shadow-lg shadow-black/20 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-base text-[#7dd3fc]">download</span>
              <span>Export System Report</span>
              <div className="flex items-center gap-1 pl-1 ml-1 text-[10px] text-[#a0b4c4]">
                <span className="px-1.5 py-0.5 rounded bg-[#141c2e] text-[#88b4cc] font-mono">
                  CSV
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#141c2e] text-[#c8a0f0] font-mono">
                  PDF
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Provision New Identity / User Enrollment Form */}
      <div className="relative rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/15 backdrop-blur-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#7dd3fc] animate-pulse"></div>
            <h2 className="text-base font-semibold text-[#e0e8f0]">
              Provision New Identity / User Enrollment
            </h2>
          </div>
          <button
            onClick={() =>
              alert(
                'Bulk CSV Template downloaded: institutional_id, email, full_name, role, department.'
              )
            }
            className="text-xs font-medium text-[#7dd3fc] hover:text-[#c8eaff] flex items-center gap-1.5 transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>Fast Bulk CSV Import</span>
          </button>
        </div>

        {addNotice && (
          <div className="mb-4 p-3 rounded-xl bg-[#0e4d6e]/50 border border-[#7dd3fc]/30 text-[#c8eaff] text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#7dd3fc]">check_circle</span>
            <span>{addNotice}</span>
          </div>
        )}

        <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-medium text-[#a0b4c4]" htmlFor="txt_add_email">
              Institutional Email / Identity
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-[#a0b4c4]/70">
                alternate_email
              </span>
              <input
                id="txt_add_email"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="first.last@university.edu"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#111828]/90 border border-[#7dd3fc]/15 text-[#e0e8f0] placeholder:text-[#a0b4c4]/50 text-xs focus:outline-none focus:bg-[#1a2438] transition-all"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-medium text-[#a0b4c4]" htmlFor="combo_add_role">
              Assigned System Role
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-[#a0b4c4]/70">
                badge
              </span>
              <select
                id="combo_add_role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as User['role'])}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#111828]/90 border border-[#7dd3fc]/15 text-[#e0e8f0] text-xs focus:outline-none focus:bg-[#1a2438] transition-all appearance-none cursor-pointer"
              >
                <option value="Student">Student (End User)</option>
                <option value="Instructor">Instructor (Faculty)</option>
                <option value="Advisor">Advisor (Counseling)</option>
                <option value="Administrator">Administrator (Root)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#a0b4c4] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-medium text-[#a0b4c4]">
              Academic / Org Department
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-[#a0b4c4]/70">
                domain
              </span>
              <select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#111828]/90 border border-[#7dd3fc]/15 text-[#e0e8f0] text-xs focus:outline-none focus:bg-[#1a2438] transition-all appearance-none cursor-pointer"
              >
                <option value="Faculty of Engineering">Faculty of Engineering</option>
                <option value="Dept. of Computer Science">Dept. of Computer Science</option>
                <option value="School of Medicine">School of Medicine</option>
                <option value="School of Business">School of Business</option>
                <option value="Global Campus Services">Global Campus Services</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#a0b4c4] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              id="btn_add_user"
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#0e4d6e] text-[#c8eaff] hover:brightness-110 border border-[#7dd3fc]/30 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0e4d6e]/20 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>Add User</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4 Bento KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="group relative rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/10 backdrop-blur-xl p-5 hover:bg-[#1a2438]/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#a0b4c4]">Total Active Users</span>
            <div className="p-2 rounded-xl bg-[#7dd3fc]/10 text-[#7dd3fc]">
              <span className="material-symbols-outlined text-lg leading-none">groups</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#e0e8f0] tracking-tight">4,820</span>
            <span className="text-xs font-semibold text-[#88b4cc] flex items-center">
              <span className="material-symbols-outlined text-sm leading-none">north_east</span>
              +4.2%
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-[#a0b4c4]">
            <span>Provisioned: 5,100 max</span>
            <span className="font-mono text-[#7dd3fc]">94.5% Cap</span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-[#202c42] overflow-hidden">
            <div className="h-full bg-[#7dd3fc] rounded-full" style={{ width: '94.5%' }}></div>
          </div>
        </div>

        <div className="group relative rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/10 backdrop-blur-xl p-5 hover:bg-[#1a2438]/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#a0b4c4]">Daily Check-ins</span>
            <div className="p-2 rounded-xl bg-[#88b4cc]/10 text-[#88b4cc]">
              <span className="material-symbols-outlined text-lg leading-none">fingerprint</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#e0e8f0] tracking-tight">18,492</span>
            <span className="text-xs font-semibold text-[#88b4cc] flex items-center">
              <span className="material-symbols-outlined text-sm leading-none">trending_up</span>
              Peak cycle
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between h-5 gap-1.5 pt-1">
            <div className="w-full bg-[#88b4cc]/20 rounded-t h-[40%]"></div>
            <div className="w-full bg-[#88b4cc]/20 rounded-t h-[60%]"></div>
            <div className="w-full bg-[#88b4cc]/40 rounded-t h-[55%]"></div>
            <div className="w-full bg-[#88b4cc]/60 rounded-t h-[80%]"></div>
            <div className="w-full bg-[#88b4cc] rounded-t h-[95%]"></div>
            <div className="w-full bg-[#88b4cc]/80 rounded-t h-[85%]"></div>
            <div className="w-full bg-[#88b4cc]/50 rounded-t h-[70%]"></div>
          </div>
          <div className="mt-2 text-[11px] text-[#a0b4c4] flex justify-between">
            <span>RFID & Geo Verification</span>
            <span className="font-mono text-[#88b4cc]">100% Synced</span>
          </div>
        </div>

        <div className="group relative rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/10 backdrop-blur-xl p-5 hover:bg-[#1a2438]/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#a0b4c4]">System Uptime</span>
            <div className="p-2 rounded-xl bg-[#c8a0f0]/10 text-[#c8a0f0]">
              <span className="material-symbols-outlined text-lg leading-none">cloud_done</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#e0e8f0] tracking-tight">99.98%</span>
            <span className="text-xs font-medium text-[#a0b4c4]">Past 90d</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-[#7dd3fc]"></div>
            <div className="flex-1 h-1.5 rounded-full bg-[#7dd3fc]"></div>
            <div className="flex-1 h-1.5 rounded-full bg-[#7dd3fc]"></div>
            <div className="flex-1 h-1.5 rounded-full bg-[#7dd3fc]"></div>
            <div className="flex-1 h-1.5 rounded-full bg-[#7dd3fc]"></div>
            <div className="flex-1 h-1.5 rounded-full bg-[#88b4cc]"></div>
          </div>
          <div className="mt-2 text-[11px] text-[#a0b4c4] flex justify-between">
            <span>Latency: 14ms edge</span>
            <span className="text-[#7dd3fc] font-mono">Cluster Stable</span>
          </div>
        </div>

        <div className="group relative rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/10 backdrop-blur-xl p-5 hover:bg-[#1a2438]/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#a0b4c4]">Security Audit</span>
            <div className="p-2 rounded-xl bg-[#0e4d6e] text-[#c8eaff]">
              <span className="material-symbols-outlined text-lg leading-none">
                rotate_90_degrees_ccw
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#e0e8f0] tracking-tight">0</span>
            <span className="text-xs font-semibold text-[#7dd3fc]">Anomalies</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px]">
            <span className="text-[#a0b4c4]">SOC2 Type II Active</span>
            <span className="px-2 py-0.5 rounded-full bg-[#7dd3fc]/10 text-[#7dd3fc] font-medium text-[10px]">
              Verified
            </span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-[#202c42] overflow-hidden">
            <div className="h-full bg-[#7dd3fc] rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* Directory: Institutional Users & Course Enrolments */}
      <div className="relative rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/15 backdrop-blur-2xl shadow-xl overflow-hidden">
        <div className="p-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#e0e8f0]">
              Directory: Institutional Users & Course Enrolments
            </h3>
            <p className="text-xs text-[#a0b4c4] mt-0.5">
              Filter by access tier, track active verification nodes, and update access permissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-[#a0b4c4]">
                search
              </span>
              <input
                id="directory_search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID or email..."
                className="pl-9 pr-4 py-2 rounded-xl bg-[#111828]/90 border border-[#7dd3fc]/15 text-xs text-[#e0e8f0] placeholder:text-[#a0b4c4]/50 focus:outline-none focus:bg-[#1a2438] transition-all w-64"
              />
            </div>

            <div className="flex items-center p-1 rounded-xl bg-[#111828]/80 border border-[#7dd3fc]/15 text-xs font-medium">
              {(['all', 'Student', 'Instructor', 'Advisor', 'Administrator'] as const).map(
                (role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      roleFilter === role
                        ? 'bg-[#0e4d6e] text-[#c8eaff] font-semibold'
                        : 'text-[#a0b4c4] hover:text-[#e0e8f0]'
                    }`}
                  >
                    {role === 'all'
                      ? 'All'
                      : role === 'Administrator'
                      ? 'Admin'
                      : `${role}s`}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Master Table (table_admin_users) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="table_admin_users">
            <thead>
              <tr className="bg-[#202c42]/40 text-[#a0b4c4] uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-6">User ID</th>
                <th className="py-3 px-6">User Identity / Email</th>
                <th className="py-3 px-6">Assigned Role</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Course Allocations</th>
                <th className="py-3 px-6">Last Login</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7dd3fc]/5 text-[#e0e8f0]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#1a2438]/40 transition-colors">
                  <td className="py-4 px-6 font-mono font-medium text-[#7dd3fc]">USR-{user.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#88b4cc]/15 flex items-center justify-center font-semibold text-[#88b4cc] text-xs shrink-0">
                        {user.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-[#e0e8f0] flex items-center gap-1.5">
                          <span>{user.fullName}</span>
                          {user.role === 'Administrator' && (
                            <span className="material-symbols-outlined text-[#7dd3fc] text-xs">
                              verified
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#a0b4c4] font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        user.role === 'Administrator'
                          ? 'bg-[#0e4d6e] text-[#c8eaff]'
                          : user.role === 'Instructor'
                          ? 'bg-[#3d2060] text-[#e8d0ff]'
                          : user.role === 'Advisor'
                          ? 'bg-[#1a3a4e] text-[#c0d8e8]'
                          : 'bg-[#202c42] text-[#88b4cc]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        user.status === 'Active'
                          ? 'bg-[#7dd3fc]/10 text-[#7dd3fc]'
                          : 'bg-[#3d1414] text-[#ff6b6b]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {user.courses.map((course, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[#141c2e] text-[#a0b4c4] border border-[#7dd3fc]/10 font-mono text-[10px]"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[#a0b4c4] font-mono text-[11px]">
                    {user.lastLogin}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => alert(`Editing permissions for ${user.fullName} (${user.email})`)}
                        className="p-1.5 rounded-lg text-[#a0b4c4] hover:text-[#7dd3fc] hover:bg-[#1a2438] transition-colors"
                        title="Edit Role & Permissions"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>

                      {user.role !== 'Administrator' && (
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          className="p-1.5 rounded-lg text-[#a0b4c4] hover:text-[#ff6b6b] hover:bg-[#1a2438] transition-colors"
                          title="Suspend / Delete Account"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      )}

                      <button
                        onClick={() => alert(`Reset MFA token credentials sent to ${user.email}.`)}
                        className="p-1.5 rounded-lg text-[#a0b4c4] hover:text-[#c8a0f0] hover:bg-[#1a2438] transition-colors"
                        title="Reset MFA Credentials"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">lock_reset</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination summary */}
        <div className="p-4 px-6 bg-[#111828]/40 border-t border-[#7dd3fc]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#a0b4c4]">
          <div>
            Showing <span className="text-[#e0e8f0] font-medium">{filteredUsers.length}</span> of{' '}
            <span className="text-[#e0e8f0] font-medium">{users.length}</span> loaded identities
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#88b4cc]">Enterprise RBAC Node: Metropolitan-US-East</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-3xl glacier-card-elevated rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#7dd3fc]/20">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#7dd3fc]">history_toggle_off</span>
                <h3 className="text-base font-bold text-[#e0e8f0]">
                  Institutional Audit Trail & Logs
                </h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-lg text-[#a0b4c4] hover:text-[#e0e8f0] hover:bg-[#1a2438]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#141c2e]/70 border border-[#7dd3fc]/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#7dd3fc]">{log.action}</span>
                      <span className="text-[10px] text-[#a0b4c4] font-mono">
                        by {log.userName || 'System'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#e0e8f0]">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#88b4cc] shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#7dd3fc]/10 flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-[#1a2438] hover:bg-[#202c42] text-[#e0e8f0] text-xs font-semibold cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
