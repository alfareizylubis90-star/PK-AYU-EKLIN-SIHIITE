import React, { useState } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { DB } from '../lib/storage';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Key, 
  Check, 
  X, 
  Edit3, 
  Plus,
  Shield
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser: User;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onRefresh,
  showToast,
}) => {
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<User | null>(null);
  const [canAddText, setCanAddText] = useState(false);
  const [canEditText, setCanEditText] = useState(false);
  const [canUpdateImage, setCanUpdateImage] = useState(false);

  const users = DB.getUsers();
  const isAdmin = currentUser.role === 'ADMIN';

  const handleOpenPermissions = (user: User) => {
    if (!isAdmin) {
      showToast('error', 'Hanya ADMIN yang dapat mengatur izin staff.');
      return;
    }
    setEditingPermissionsUser(user);
    setCanAddText(user.permissions?.canAddText ?? false);
    setCanEditText(user.permissions?.canEditText ?? false);
    setCanUpdateImage(user.permissions?.canUpdateImage ?? false);
  };

  const handleSavePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermissionsUser || !isAdmin) return;

    const updated: User = {
      ...editingPermissionsUser,
      permissions: {
        canAddText,
        canEditText,
        canUpdateImage,
      },
    };

    DB.saveUser(updated);
    DB.addLog(
      currentUser.name,
      currentUser.role,
      'UPDATE PERMISSION',
      'USER MANAGEMENT',
      `Memperbarui hak akses untuk ${editingPermissionsUser.name} (${editingPermissionsUser.role})`
    );

    showToast('success', `✅ Hak akses ${editingPermissionsUser.name} diperbarui.`);
    setEditingPermissionsUser(null);
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#292929]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white font-['Poppins',sans-serif]">
                User Management
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1.5">
              Daftar pengguna dan konfigurasi izin akses peran (ADMIN, STAFF, dan USER) pada sistem PK AYU EKLIN SIHIITE.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#151515] border border-[#222222] text-xs text-[#777777] font-mono">
            Admin Privilege Active
          </div>
        </div>

        {/* Users Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#292929] text-[11px] font-mono text-[#777777] uppercase tracking-wider bg-[#111111]/50">
                <th className="py-3 px-4 w-12 text-center">NO</th>
                <th className="py-3 px-4">PENGGUNA</th>
                <th className="py-3 px-4">EMAIL</th>
                <th className="py-3 px-4">ROLE</th>
                <th className="py-3 px-4">HAK AKSES KONTEN</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {users.map((u, index) => {
                const isUserAdmin = u.role === 'ADMIN';
                const isStaff = u.role === 'STAFF';

                return (
                  <tr key={u.id} className="hover:bg-[#111111] transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-[#777777]">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          className="w-8 h-8 rounded-lg object-cover border border-[#292929]"
                        />
                        <span className="font-semibold text-white text-xs">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-[#A0A0A0]">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          u.role === 'ADMIN'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : u.role === 'STAFF'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {isUserAdmin ? (
                        <span className="text-blue-400 font-mono text-[11px] font-medium">
                          Semua Akses (Penuh)
                        </span>
                      ) : isStaff ? (
                        <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                          <span className={u.permissions?.canAddText ? 'text-emerald-400' : 'text-[#666666]'}>
                            {u.permissions?.canAddText ? '+Tambah Teks' : '-Tambah'}
                          </span>
                          <span>•</span>
                          <span className={u.permissions?.canEditText ? 'text-emerald-400' : 'text-[#666666]'}>
                            {u.permissions?.canEditText ? '✓Edit' : '-Edit'}
                          </span>
                          <span>•</span>
                          <span className={u.permissions?.canUpdateImage ? 'text-emerald-400' : 'text-[#666666]'}>
                            {u.permissions?.canUpdateImage ? '✓Gambar' : '-Gambar'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#777777] text-[11px]">
                          Hanya Baca & Salin Teks
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Aktif
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isStaff && isAdmin ? (
                        <button
                          onClick={() => handleOpenPermissions(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#151515] hover:bg-[#202020] text-blue-400 border border-[#292929] hover:border-blue-500/30 text-xs font-medium inline-flex items-center gap-1 transition-all"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Atur Izin</span>
                        </button>
                      ) : (
                        <span className="text-xs text-[#555555] font-mono">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Modal for Staff */}
      {editingPermissionsUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#292929] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <h4 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                  Hak Akses Staff: {editingPermissionsUser.name}
                </h4>
              </div>
              <button
                onClick={() => setEditingPermissionsUser(null)}
                className="text-[#A0A0A0] hover:text-white p-1 rounded-lg hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} className="mt-5 space-y-4">
              <p className="text-xs text-[#A0A0A0]">
                Tentukan hak akses khusus untuk peran STAFF ini:
              </p>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#151515] border border-[#292929] cursor-pointer hover:border-blue-500/30">
                <span className="text-xs text-white font-medium">Boleh Menambah Teks</span>
                <input
                  type="checkbox"
                  checked={canAddText}
                  onChange={(e) => setCanAddText(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#151515] border border-[#292929] cursor-pointer hover:border-blue-500/30">
                <span className="text-xs text-white font-medium">Boleh Mengedit Teks</span>
                <input
                  type="checkbox"
                  checked={canEditText}
                  onChange={(e) => setCanEditText(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#151515] border border-[#292929] cursor-pointer hover:border-blue-500/30">
                <span className="text-xs text-white font-medium">Boleh Mengupdate/Hapus Gambar</span>
                <input
                  type="checkbox"
                  checked={canUpdateImage}
                  onChange={(e) => setCanUpdateImage(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setEditingPermissionsUser(null)}
                  className="px-4 py-2 rounded-xl border border-[#292929] bg-[#151515] hover:bg-[#1a1a1a] text-[#A0A0A0] hover:text-white text-xs font-semibold"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20"
                >
                  SIMPAN IZIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
