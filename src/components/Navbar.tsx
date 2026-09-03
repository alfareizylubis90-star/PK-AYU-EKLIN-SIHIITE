import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  Menu, 
  Clock, 
  ChevronDown, 
  LogOut, 
  Check, 
  Lock,
  Globe,
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { DB, formatDateTime } from '../lib/storage';
import { GoogleSheetDB, SheetConnectionStatus } from '../lib/googleSheetDb';

interface NavbarProps {
  currentUser: User;
  onToggleSidebar: () => void;
  onUserChange: (user: User) => void;
  onLogout: () => void;
  currentTitle: string;
  onNavigateSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onToggleSidebar,
  onUserChange,
  onLogout,
  currentTitle,
  onNavigateSettings,
}) => {
  const [currentTime, setCurrentTime] = useState(formatDateTime(new Date()));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [sheetStatus, setSheetStatus] = useState<SheetConnectionStatus>('idle');
  const users = DB.getUsers();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatDateTime(new Date()));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Check Google Sheet status
  useEffect(() => {
    let isMounted = true;
    GoogleSheetDB.testConnection().then((res) => {
      if (isMounted) {
        setSheetStatus(res.status);
      }
    });

    const handleConfigChange = () => {
      GoogleSheetDB.testConnection().then((res) => {
        if (isMounted) setSheetStatus(res.status);
      });
    };

    window.addEventListener('pk_sheet_config_updated', handleConfigChange);
    return () => {
      isMounted = false;
      window.removeEventListener('pk_sheet_config_updated', handleConfigChange);
    };
  }, []);

  const handleSwitchRole = (targetUser: User) => {
    DB.setCurrentUser(targetUser);
    onUserChange(targetUser);
    setRoleSwitcherOpen(false);
    setDropdownOpen(false);
    DB.addLog(targetUser.name, targetUser.role, 'LOGIN', 'SISTEM', `Beralih ke akun ${targetUser.role}`);
  };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'STAFF':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'USER':
        return 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30';
    }
  };

  return (
    <header className="h-16 bg-[#0B0B0B] border-b border-[#292929] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Mobile Hamburger + Current Title */}
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-[#A0A0A0] hover:text-white hover:bg-[#151515] border border-transparent hover:border-[#292929]"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 hidden sm:block animate-pulse"></div>
          <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight font-['Poppins',sans-serif]">
            {currentTitle}
          </h2>
        </div>
      </div>

      {/* Right side: Time, Role Switcher, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Google Sheet Database Status Badge */}
        <button
          id="btn-nav-sheet-status"
          type="button"
          onClick={onNavigateSettings}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            sheetStatus === 'connected'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : sheetStatus === 'needs_setup'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              : sheetStatus === 'testing' || sheetStatus === 'syncing'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
              : 'bg-[#111111] border-[#222222] text-[#A0A0A0] hover:text-white hover:border-[#333333]'
          }`}
          title="Status Koneksi Database Google Sheet (Klik untuk buka Pengaturan)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span className="hidden sm:inline">
            {sheetStatus === 'connected'
              ? 'Doc Sheet: Terhubung'
              : sheetStatus === 'needs_setup'
              ? 'Doc Sheet: Perlu ID'
              : sheetStatus === 'testing' || sheetStatus === 'syncing'
              ? 'Doc Sheet: Sinkron...'
              : 'Doc Sheet Terkait'}
          </span>
          <span className="sm:hidden text-[11px]">Doc Sheet</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              sheetStatus === 'connected'
                ? 'bg-emerald-400'
                : sheetStatus === 'needs_setup'
                ? 'bg-amber-400 animate-pulse'
                : sheetStatus === 'testing' || sheetStatus === 'syncing'
                ? 'bg-blue-400'
                : 'bg-neutral-500'
            }`}
          />
        </button>

        {/* System Time */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#222222] text-xs text-[#A0A0A0] font-mono">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{currentTime} WIB</span>
        </div>

        {/* Quick Role Switcher Pill */}
        <div className="relative">
          <button
            id="btn-role-switcher"
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${getRoleBadge(
              currentUser.role
            )} hover:brightness-110`}
            title="Ganti Peran/Role untuk Pengujian"
          >
            <span>ROLE: {currentUser.role}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {roleSwitcherOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setRoleSwitcherOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-56 bg-[#111111] border border-[#292929] rounded-xl shadow-2xl p-2 z-50 text-xs">
                <div className="px-2 py-1.5 text-[10px] text-[#777777] font-semibold uppercase tracking-wider">
                  Ubah Role Pengguna (Demo)
                </div>
                <div className="space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchRole(u)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                        currentUser.id === u.id
                          ? 'bg-[#1e1e1e] text-white font-medium'
                          : 'text-[#A0A0A0] hover:text-white hover:bg-[#181818]'
                      }`}
                    >
                      <div className="flex flex-col truncate">
                        <span className="truncate">{u.name}</span>
                        <span className="text-[10px] text-[#666666] truncate">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                        {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-[#222222] px-2 text-[10px] text-[#666666] leading-relaxed">
                  Ganti role untuk memverifikasi hak akses ADMIN, STAFF, dan USER sesuai spesifikasi.
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            id="btn-user-profile"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-transparent hover:border-[#292929] hover:bg-[#151515] transition-all"
          >
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover border border-[#292929]"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-[#A0A0A0] truncate max-w-[120px]">
                {currentUser.email}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#A0A0A0] hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-64 bg-[#111111] border border-[#292929] rounded-xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-[#222222]">
                  <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                  <p className="text-[11px] text-[#A0A0A0]">{currentUser.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getRoleBadge(currentUser.role)}`}>
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-[#22C55E] flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                      Online
                    </span>
                  </div>
                </div>

                {/* Permissions summary */}
                <div className="px-3 py-2 text-[11px] text-[#777777] border-b border-[#222222] space-y-1">
                  <div className="font-semibold text-[#A0A0A0] text-[10px] uppercase">Hak Akses:</div>
                  <div className="flex items-center justify-between">
                    <span>Kelola Modul PK</span>
                    <span className={currentUser.role === 'ADMIN' ? 'text-emerald-400' : 'text-neutral-500'}>
                      {currentUser.role === 'ADMIN' ? 'Ya' : 'Tidak'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kelola Konten Teks</span>
                    <span className={currentUser.role === 'ADMIN' || (currentUser.role === 'STAFF' && currentUser.permissions.canAddText) ? 'text-emerald-400' : 'text-neutral-500'}>
                      {currentUser.role === 'ADMIN' || (currentUser.role === 'STAFF' && currentUser.permissions.canAddText) ? 'Ya' : 'Hanya Baca'}
                    </span>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    id="btn-logout"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Sistem</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
