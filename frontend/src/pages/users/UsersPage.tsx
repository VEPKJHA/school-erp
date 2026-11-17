import React, { useEffect, useState } from 'react';
import {
  Plus,
  Shield,
  UserCheck,
  UserX,
  Loader2,
  Settings,
  Lock,
  Check,
  CheckCircle2,
  KeyRound,
  Users as UsersIcon,
  Search,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserService } from '../../services/user.service';
import { User, Role } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage Roles Modal state
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);
  const [selectedPermCodes, setSelectedPermCodes] = useState<string[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // New Role Form
  const [roleForm, setRoleForm] = useState({
    name: '',
    code: '',
    description: '',
    permissionCodes: [] as string[],
  });

  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    roleId: '',
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData, permsData] = await Promise.all([
        UserService.getUsers({
          search: search || undefined,
          roleId: selectedRoleId || undefined,
        }),
        UserService.getRoles(),
        UserService.getPermissions().catch(() => []),
      ]);

      const safeUsers = Array.isArray(usersData)
        ? usersData
        : (usersData as any)?.users || (usersData as any)?.data || [];
      const safeRoles = Array.isArray(rolesData)
        ? rolesData
        : (rolesData as any)?.roles || (rolesData as any)?.data || [];
      const safePerms = Array.isArray(permsData)
        ? permsData
        : (permsData as any)?.permissions || (permsData as any)?.data || [];

      setUsers(safeUsers);
      setRoles(safeRoles);
      setPermissions(safePerms);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load staff list');
      setUsers([]);
      setRoles([]);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedRoleId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.roleId) {
      error('Please select an administrative or academic role');
      return;
    }
    setIsSubmitting(true);
    try {
      await UserService.createUser(form);
      success('Staff user created successfully');
      setIsModalOpen(false);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        roleId: '',
      });
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userItem: User) => {
    const newStatus = userItem.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await UserService.updateStatus(userItem.id, newStatus);
      success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleOpenEditPermissions = (role: Role) => {
    setSelectedRoleForEdit(role);
    const existingCodes = role.permissions?.map((p: any) => p.permission.code) || [];
    setSelectedPermCodes(existingCodes);
  };

  const handleTogglePerm = (code: string) => {
    setSelectedPermCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleToggleModulePerms = (moduleName: string, modulePermCodes: string[]) => {
    const allSelected = modulePermCodes.every((c) => selectedPermCodes.includes(c));
    if (allSelected) {
      setSelectedPermCodes((prev) => prev.filter((c) => !modulePermCodes.includes(c)));
    } else {
      setSelectedPermCodes((prev) => Array.from(new Set([...prev, ...modulePermCodes])));
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleForEdit) return;
    setIsSavingPermissions(true);
    try {
      await UserService.updateRolePermissions(selectedRoleForEdit.id, selectedPermCodes);
      success(`Permissions updated for role ${selectedRoleForEdit.name}!`);
      setSelectedRoleForEdit(null);
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim() || !roleForm.code.trim()) {
      error('Role name and code are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await UserService.createRole(roleForm);
      success(`Custom role "${created.name}" created successfully!`);
      setIsCreateRoleModalOpen(false);
      setRoleForm({ name: '', code: '', description: '', permissionCodes: [] });
      const updatedRoles = await UserService.getRoles();
      const safeRoles = Array.isArray(updatedRoles)
        ? updatedRoles
        : (updatedRoles as any)?.roles || (updatedRoles as any)?.data || [];
      setRoles(safeRoles);
      // Auto-select in user form if open
      if (isModalOpen) {
        setForm((prev) => ({ ...prev, roleId: created.id }));
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions by Module
  const permsByModule: Record<string, any[]> = {};
  permissions.forEach((p) => {
    const mod = p.module || 'General';
    if (!permsByModule[mod]) permsByModule[mod] = [];
    permsByModule[mod].push(p);
  });

  const columns: Column<User>[] = [
    {
      header: 'Staff Member',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm block">
            {row.firstName} {row.lastName}
          </span>
          <span className="text-xs text-slate-400 font-mono">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Designated Role',
      accessor: (row) => (
        <div className="flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-medium text-slate-700 text-xs">{row.role?.name}</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
            {row.role?.code}
          </span>
        </div>
      ),
    },
    {
      header: 'Phone Contact',
      accessor: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.phone || '—'}
        </span>
      ),
    },
    {
      header: 'Account Status',
      accessor: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'danger'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center space-x-2">
          {hasPermission('user:update') && (
            <button
              onClick={() => handleToggleStatus(row)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                row.status === 'ACTIVE'
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-emerald-600 hover:bg-emerald-50'
              }`}
              title={row.status === 'ACTIVE' ? 'Deactivate user' : 'Activate user'}
            >
              {row.status === 'ACTIVE' ? (
                <UserX className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-indigo-600" />
              Staff & User Directory
            </h1>
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              RBAC Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provision staff profiles, assign organizational roles, and configure module permission boundaries for your school.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Manage Roles Button */}
          <button
            onClick={() => setIsRolesModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-200"
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Manage Roles ({Array.isArray(roles) ? roles.length : 0})</span>
          </button>

          {/* Create Custom Role Button */}
          <button
            onClick={() => setIsCreateRoleModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-indigo-200"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>+ Create Role</span>
          </button>

          {/* Add Staff Button */}
          {hasPermission('user:create') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All Roles ({Array.isArray(roles) ? roles.length : 0})</option>
            {(Array.isArray(roles) ? roles : []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.code})
              </option>
            ))}
          </select>

          {(selectedRoleId || search) && (
            <button
              onClick={() => {
                setSelectedRoleId('');
                setSearch('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {users.length} enrolled staff members
        </span>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        searchPlaceholder="Search staff by name, email, or phone..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No staff members found."
      />

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Staff Account"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="staff@school.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Temporary Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Role & Permissions <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreateRoleModalOpen(true)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>+ Create New Role</span>
              </button>
            </div>
            <select
              required
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="">Select a Role ({Array.isArray(roles) ? roles.length : 0} available)</option>
              {(Array.isArray(roles) ? roles : []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Assigns module access for fees, student attendance, exams, and academic workflows.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Roles & Permissions Modal */}
      <Modal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
        title="Manage Tenant Roles & Permissions"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Provisioned Roles</h3>
              <p className="text-slate-500 text-[11px]">
                Configured access profiles available to staff members in this school.
              </p>
            </div>
            <button
              onClick={() => setIsCreateRoleModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Role</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
            {(Array.isArray(roles) ? roles : []).map((r) => {
              const permsCount = r.permissions?.length || r._count?.permissions || 0;
              const usersCount = r._count?.users || 0;

              return (
                <div
                  key={r.id}
                  className="p-3 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {r.code}
                      </span>
                      {r.isSystem && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.2 rounded border border-amber-200">
                          System Role
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px]">{r.description || 'Custom staff role'}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-0.5">
                      <span>Permissions: <strong>{permsCount}</strong></span>
                      <span>•</span>
                      <span>Assigned Staff: <strong>{usersCount}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditPermissions(r)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Permissions</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsRolesModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Role Permissions Modal */}
      <Modal
        isOpen={!!selectedRoleForEdit}
        onClose={() => setSelectedRoleForEdit(null)}
        title={`Permissions: ${selectedRoleForEdit?.name} (${selectedRoleForEdit?.code})`}
        maxWidth="lg"
      >
        {selectedRoleForEdit && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-indigo-900">
                  Configuring {selectedRoleForEdit.name}
                </p>
                <p className="text-indigo-700 text-[11px]">
                  Select the granular module permissions authorized for staff holding this role.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-white rounded-lg text-indigo-700 font-bold border border-indigo-200">
                {selectedPermCodes.length} Authorized
              </span>
            </div>

            {/* Modules Checkbox Matrix */}
            <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
              {Object.entries(permsByModule).map(([moduleName, modulePerms]) => {
                const moduleCodes = modulePerms.map((p) => p.code);
                const allSelected = moduleCodes.every((c) => selectedPermCodes.includes(c));
                const someSelected = moduleCodes.some((c) => selectedPermCodes.includes(c));

                return (
                  <div key={moduleName} className="border border-slate-200 rounded-xl p-3 bg-white">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                          {moduleName} Module
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          ({moduleCodes.filter((c) => selectedPermCodes.includes(c)).length}/{moduleCodes.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleModulePerms(moduleName, moduleCodes)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {modulePerms.map((p) => {
                        const isChecked = selectedPermCodes.includes(p.code);
                        return (
                          <label
                            key={p.code}
                            className={`flex items-start space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-medium'
                                : 'bg-slate-50/50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePerm(p.code)}
                              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <span className="font-mono text-[11px] block text-indigo-700 font-semibold">
                                {p.code}
                              </span>
                              <span className="text-[10px] text-slate-500 block leading-tight">
                                {p.description}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRoleForEdit(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingPermissions}
                onClick={handleSaveRolePermissions}
                className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingPermissions && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Permissions</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Custom Role Modal */}
      <Modal
        isOpen={isCreateRoleModalOpen}
        onClose={() => setIsCreateRoleModalOpen(false)}
        title="Create Custom School Role"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomRole} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Role Display Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Exam Coordinator or Transport In-Charge"
              value={roleForm.name}
              onChange={(e) => {
                const name = e.target.value;
                const autoCode = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
                setRoleForm({
                  ...roleForm,
                  name,
                  code: roleForm.code ? roleForm.code : autoCode,
                });
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Unique Role Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. EXAM_COORDINATOR"
              value={roleForm.code}
              onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Responsibilities
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of this role's purpose..."
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateRoleModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Role</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
