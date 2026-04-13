import React, { useState, useEffect } from 'react';
import { swalSuccess, swalError, swalWarning, swalInfo, swalConfirm, swalCredentials, swalCopied } from '../../utils/swal';
import { useData } from '../../context/GlobalDataContext';
import api from '../../utils/api';
import { Shield, Lock, Check, X, ShieldAlert, Zap, Save, RefreshCcw, Eye, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACTION_COLS = [
    { key: 'can_view', label: 'View', icon: Eye, color: 'text-info' },
    { key: 'can_add', label: 'Add', icon: Plus, color: 'text-success' },
    { key: 'can_edit', label: 'Edit', icon: Pencil, color: 'text-warning' },
    { key: 'can_delete', label: 'Delete', icon: Trash2, color: 'text-danger' },
];

const RolesPermissions = () => {
    const { roles: defaultRoles } = useData();
    const [roles, setRoles] = useState([]);
    const [menus, setMenus] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [permissionMatrix, setPermissionMatrix] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [rolesRes, menusRes] = await Promise.all([
                api.get('/roles'),
                api.get('/roles/menus')
            ]);

            if (rolesRes.data?.success) setRoles(rolesRes.data.data);
            if (menusRes.data?.success) setMenus(menusRes.data.data);

            if (rolesRes.data?.data?.length > 0) {
                handleSelectRole(rolesRes.data.data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch RBAC data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        setSuccessMsg('');
        try {
            const res = await api.get(`/roles/${role.id}/permissions`);
            if (res.data?.success) {
                // Build matrix: { [menu_id]: { can_view, can_add, can_edit, can_delete } }
                const matrix = {};
                res.data.data.forEach(p => {
                    matrix[p.id] = {
                        can_view: !!p.can_view,
                        can_add: !!p.can_add,
                        can_edit: !!p.can_edit,
                        can_delete: !!p.can_delete,
                    };
                });
                setPermissionMatrix(matrix);
            }
        } catch (error) {
            console.error("Failed to fetch role permissions", error);
        }
    };

    const handleToggle = (menuId, actionKey) => {
        setPermissionMatrix(prev => ({
            ...prev,
            [menuId]: {
                ...prev[menuId],
                [actionKey]: !prev[menuId]?.[actionKey],
            }
        }));
    };

    const handleToggleAll = (menuId) => {
        const current = permissionMatrix[menuId] || {};
        const allEnabled = ACTION_COLS.every(a => current[a.key]);
        setPermissionMatrix(prev => ({
            ...prev,
            [menuId]: ACTION_COLS.reduce((acc, a) => ({ ...acc, [a.key]: !allEnabled }), {})
        }));
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        setSaving(true);
        setSuccessMsg('');
        try {
            // Get current menu IDs for filtering
            const validMenuIds = new Set(menus.map(m => m.id));

            const permissions = Object.entries(permissionMatrix)
                .filter(([menuId]) => validMenuIds.has(parseInt(menuId)))
                .map(([menuId, actions]) => ({
                    menu_id: parseInt(menuId),
                    ...actions
                }));

            const res = await api.post(`/roles/${selectedRole.id}/permissions`, { permissions });
            if (res.data?.success) {
                setSuccessMsg('Permissions saved successfully!');
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (error) {
            console.error("Failed to save permissions", error);
            swalError('Access Denied', 'Security override failed.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <RefreshCcw className="animate-spin text-accent" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white italic uppercase mb-1 flex items-center gap-3">
                        <Shield className="text-accent" /> Security Hub & RBAC
                    </h1>
                    <p className="text-secondary text-xs font-black uppercase tracking-[0.2em] opacity-70">Define access protocols · Menu & Action level controls.</p>
                </div>
                <div className="flex items-center gap-3">
                    {successMsg && (
                        <span className="text-success text-xs font-bold uppercase tracking-widest animate-pulse">{successMsg}</span>
                    )}
                    <button
                        className="btn-primary flex items-center gap-2 h-12 px-8 disabled:opacity-50"
                        onClick={handleSavePermissions}
                        disabled={saving}
                    >
                        {saving ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />}
                        {saving ? 'DEPLOYING...' : 'SAVE PROTOCOLS'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Roles Column */}
                <div className="lg:col-span-1 space-y-4">
                    <p className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-accent pl-3">Institutional Roles</p>
                    <div className="glass-card p-2 space-y-1">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => handleSelectRole(role)}
                                className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between group ${
                                    selectedRole?.id === role.id
                                        ? 'bg-accent text-black font-bold'
                                        : 'hover:bg-white/5 text-secondary hover:text-white'
                                }`}
                            >
                                <span className="uppercase text-xs tracking-widest">{role.name.replace(/_/g, ' ')}</span>
                                <Lock size={14} className={selectedRole?.id === role.id ? 'text-black' : 'text-accent opacity-0 group-hover:opacity-100'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Matrix */}
                <div className="lg:col-span-3 space-y-4">
                    <p className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-accent pl-3">
                        Access Matrix: {selectedRole?.name?.toUpperCase().replace(/_/g, ' ')}
                    </p>
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left px-6 py-4 text-[10px] text-accent font-black uppercase tracking-widest">Menu</th>
                                        {ACTION_COLS.map(col => (
                                            <th key={col.key} className="px-4 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <col.icon size={14} className={col.color} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-secondary">{col.label}</span>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-4 py-4 text-center">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-secondary">All</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menus.map(menu => {
                                        const perms = permissionMatrix[menu.id] || {};
                                        const allEnabled = ACTION_COLS.every(a => perms[a.key]);
                                        return (
                                            <tr key={menu.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-3">
                                                    <span className="text-xs font-bold text-white uppercase tracking-wider">{menu.name}</span>
                                                    <span className="block text-[9px] text-muted">{menu.path}</span>
                                                </td>
                                                {ACTION_COLS.map(col => (
                                                    <td key={col.key} className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleToggle(menu.id, col.key)}
                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all mx-auto ${
                                                                perms[col.key]
                                                                    ? 'bg-accent border-accent text-black shadow-lg shadow-accent/20'
                                                                    : 'border-white/10 text-muted hover:border-white/20 hover:bg-white/5'
                                                            }`}
                                                        >
                                                            {perms[col.key] ? <Check size={14} /> : <X size={10} className="opacity-30" />}
                                                        </button>
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleToggleAll(menu.id)}
                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all mx-auto ${
                                                            allEnabled
                                                                ? 'bg-success/20 border-success/40 text-success'
                                                                : 'border-white/10 text-muted hover:border-white/20'
                                                        }`}
                                                    >
                                                        <Zap size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-danger/5 border border-danger/20 flex gap-4">
                        <ShieldAlert className="text-danger shrink-0" size={24} />
                        <div>
                            <p className="text-[10px] font-black text-danger uppercase tracking-widest mb-1">Critical Security Alert</p>
                            <p className="text-[9px] text-danger/70 leading-relaxed uppercase">Modifying these matrices immediately alters the access protocols for all assigned personnel. Users must re-login to see updated menus.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RolesPermissions;
