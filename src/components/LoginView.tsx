import React, { useState } from 'react';
import { User } from '../types';
import { DB } from '../lib/storage';
import { Layers, ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  showToast,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const users = DB.getUsers();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (found) {
      DB.setCurrentUser(found);
      DB.addLog(found.name, found.role, 'LOGIN', 'SISTEM', 'Pengguna berhasil masuk ke dashboard');
      showToast('success', `Selamat datang kembali, ${found.name}!`);
      onLoginSuccess(found);
    } else {
      // Default to admin if custom
      const adminUser = users[0];
      DB.setCurrentUser(adminUser);
      DB.addLog(adminUser.name, adminUser.role, 'LOGIN', 'SISTEM', 'Pengguna masuk ke dashboard');
      showToast('success', `Masuk sebagai ${adminUser.name}`);
      onLoginSuccess(adminUser);
    }
  };

  const handleQuickLogin = (user: User) => {
    DB.setCurrentUser(user);
    DB.addLog(user.name, user.role, 'LOGIN', 'SISTEM', `Masuk cepat dengan peran ${user.role}`);
    showToast('success', `Masuk sebagai ${user.name} (${user.role})`);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0B0B0B] border border-[#292929] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-['Poppins',sans-serif]">
            PK AYU EKLIN SIHIITE
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            Sistem Manajemen Modul PK, Konten Teks & Gambar
          </p>
        </div>

        {/* Regular login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-1.5">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@pkshiite.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#151515] border border-[#292929] text-white text-sm placeholder-[#555555] focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#151515] border border-[#292929] text-white text-sm placeholder-[#555555] focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Masuk ke Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login Switcher */}
        <div className="pt-4 border-t border-[#222222] space-y-2">
          <div className="text-[11px] font-mono text-[#777777] text-center uppercase tracking-wider">
            Masuk Cepat Demo (Sesuai Role):
          </div>
          <div className="grid grid-cols-3 gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleQuickLogin(u)}
                className="p-2 rounded-xl bg-[#151515] hover:bg-[#1f1f1f] border border-[#292929] text-center transition-all group"
              >
                <p className="text-xs font-bold text-white group-hover:text-blue-400">
                  {u.role}
                </p>
                <p className="text-[10px] text-[#777777] truncate">{u.name.split(' ')[0]}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
