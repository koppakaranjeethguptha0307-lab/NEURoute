import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
  Clock,
  Building,
  Mail,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserItem {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  phone_number?: string;
  department?: string;
  created_at: string;
}

interface AccessRequestItem {
  id: number;
  full_name: string;
  email: string;
  organization: string;
  requested_role: string;
  phone_number?: string;
  reason?: string;
  status: string;
  created_at: string;
}

export const UserManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New user form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('FIELD_OFFICER');
  const [newPassword, setNewPassword] = useState('password123');
  const [newDepartment, setNewDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${baseUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAccessRequests = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${baseUrl}/admin/access-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAccessRequests(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUsers(), fetchAccessRequests()]);
      setIsLoading(false);
    };
    loadData();
  }, [token]);

  const handleToggleUserStatus = async (userId: number, currentActive: boolean) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${baseUrl}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (res.ok) {
        setNotification(`User account status updated.`);
        fetchUsers();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${baseUrl}/admin/access-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotification(`Access request approved and operational account provisioned.`);
        fetchUsers();
        fetchAccessRequests();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${baseUrl}/admin/access-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotification(`Access request rejected.`);
        fetchAccessRequests();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    setIsSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${baseUrl}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          department: newDepartment,
        }),
      });
      if (res.ok) {
        setNotification(`Operational user ${newEmail} created successfully.`);
        setShowCreateModal(false);
        setNewEmail('');
        setNewName('');
        fetchUsers();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 p-6 text-white shadow-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600/30 border border-brand-500/30">
            <Users className="h-7 w-7 text-brand-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-brand-500/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-300">
                Admin Control Panel
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">User Management & Role Provisioning</h1>
            <p className="text-sm text-slate-300">
              Manage system access, approve account applications, and enforce role permissions.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500"
        >
          <UserPlus className="h-4 w-4" /> Provision New User
        </button>
      </div>

      {notification && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            activeTab === 'users'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          Active Operational Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            activeTab === 'requests'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          Access Applications ({accessRequests.filter((r) => r.status === 'PENDING').length} Pending)
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : activeTab === 'users' ? (
        /* Users Table */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-bold">User</th>
                  <th className="px-6 py-3.5 font-bold">Email</th>
                  <th className="px-6 py-3.5 font-bold">Operational Role</th>
                  <th className="px-6 py-3.5 font-bold">Department</th>
                  <th className="px-6 py-3.5 font-bold">Account Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.full_name || u.username}</td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'FIELD_OFFICER'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'DRIVER'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{u.department || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                          u.is_active
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Access Requests List */
        <div className="space-y-4">
          {accessRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              No access requests recorded yet.
            </div>
          ) : (
            accessRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{req.full_name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                        req.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" /> {req.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-slate-400" /> {req.organization}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Requested Role: {req.requested_role}
                    </span>
                  </div>
                  {req.reason && <p className="mt-2 text-xs italic text-slate-500">"{req.reason}"</p>}
                </div>

                {req.status === 'PENDING' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleApproveRequest(req.id)}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500"
                    >
                      <Check className="h-4 w-4" /> Approve & Provision
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Provision User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-white">
            <h3 className="text-xl font-bold mb-2">Provision Operational Account</h3>
            <p className="text-xs text-slate-400 mb-6">Create a verified account directly in the backend database.</p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100"
                >
                  <option value="FIELD_OFFICER">FIELD OFFICER</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="LOGISTICS_PLANNER">LOGISTICS PLANNER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Temporary Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department / Organization</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g. Disaster Relief Ops"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100"
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
