import React from 'react';
import { PKModule, User } from '../types';
import { 
  Home, 
  Globe, 
  ClipboardList, 
  Users, 
  Settings, 
  Layers, 
  ShieldCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  selectedPkId: string | null;
  modules: PKModule[];
  currentUser: User;
  isOpen: boolean;
  onCloseMobile: () => void;
  onNavigate: (view: string, pkId?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedPkId,
  modules,
  currentUser,
  isOpen,
  onCloseMobile,
  onNavigate,
}) => {
  // If role is USER, only show active modules; for ADMIN & STAFF, show all modules with status indicator
  const visibleModules = currentUser.role === 'USER' 
    ? modules.filter(m => m.status === 'active')
    : modules;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-[#0B0B0B] border-r border-[#292929] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top brand header */}
        <div className="flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 sm:px-5 border-b border-[#292929]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-white text-xs sm:text-sm tracking-tight font-['Poppins',sans-serif] leading-tight truncate" title="PK AYU EKLIN SIHIITE">
                  PK AYU EKLIN SIHIITE
                </h1>
                <p className="text-[11px] text-[#A0A0A0] flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  v2.4 Dashboard
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#A0A0A0] hover:text-white rounded-md hover:bg-[#151515]"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* Dashboard Link */}
            <div>
              <button
                id="nav-btn-dashboard"
                onClick={() => {
                  onNavigate('dashboard');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-[#151515] text-[#3B82F6] border border-[#292929] shadow-sm'
                    : 'text-[#A0A0A0] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* MENU SECTION: Dynamic PK Modules */}
            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#777777] uppercase font-mono flex items-center justify-between">
                <span>MENU</span>
                <span className="text-[10px] bg-[#151515] px-1.5 py-0.5 rounded border border-[#222222]">
                  {visibleModules.length}
                </span>
              </div>
              <div className="space-y-1">
                {visibleModules.length === 0 ? (
                  <p className="text-xs text-[#777777] px-3 py-2 italic">Belum ada modul PK</p>
                ) : (
                  visibleModules.map((module) => {
                    const isSelected = currentView === 'pk-module' && selectedPkId === module.id;
                    return (
                      <button
                        key={module.id}
                        id={`nav-pk-${module.id}`}
                        onClick={() => {
                          onNavigate('pk-module', module.id);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                          isSelected
                            ? 'bg-[#151515] text-[#3B82F6] border border-[#292929] shadow-sm'
                            : 'text-[#A0A0A0] hover:text-white hover:bg-[#111111]'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Globe className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#3B82F6]' : 'text-[#777777] group-hover:text-white'}`} />
                          <span className="truncate">{module.name_pk}</span>
                        </div>
                        {module.status === 'inactive' && currentUser.role !== 'USER' && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                            Off
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* AKTIVITAS SECTION */}
            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#777777] uppercase font-mono">
                AKTIVITAS
              </div>
              <div className="space-y-1">
                <button
                  id="nav-btn-activity-log"
                  onClick={() => {
                    onNavigate('activity-log');
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'activity-log'
                      ? 'bg-[#151515] text-[#3B82F6] border border-[#292929]'
                      : 'text-[#A0A0A0] hover:text-white hover:bg-[#111111]'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Activity Log</span>
                </button>

                {currentUser.role === 'ADMIN' && (
                  <button
                    id="nav-btn-user-management"
                    onClick={() => {
                      onNavigate('users');
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      currentView === 'users'
                        ? 'bg-[#151515] text-[#3B82F6] border border-[#292929]'
                        : 'text-[#A0A0A0] hover:text-white hover:bg-[#111111]'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>User Management</span>
                  </button>
                )}
              </div>
            </div>

            {/* PENGATURAN SECTION (Contains PK Management) */}
            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#777777] uppercase font-mono">
                SISTEM
              </div>
              <button
                id="nav-btn-pengaturan"
                onClick={() => {
                  onNavigate('pengaturan');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'pengaturan'
                    ? 'bg-[#151515] text-[#3B82F6] border border-[#292929]'
                    : 'text-[#A0A0A0] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4" />
                  <span>Pengaturan</span>
                </div>
                {currentUser.role === 'ADMIN' && (
                  <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                    Kelola PK
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-[#292929] bg-[#080808]">
          <div className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-[#777777]">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="truncate">
              <p className="text-white text-xs font-medium truncate">{currentUser.name}</p>
              <p className="text-[10px] text-[#A0A0A0] capitalize">Role: {currentUser.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
