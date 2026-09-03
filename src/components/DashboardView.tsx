import React from 'react';
import { PKModule, PKText, ActivityLog, User } from '../types';
import { DB } from '../lib/storage';
import { 
  Globe, 
  FileText, 
  Image as ImageIcon, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Layers,
  ShieldCheck,
  Settings
} from 'lucide-react';

interface DashboardViewProps {
  modules: PKModule[];
  currentUser: User;
  onNavigateToPk: (pkId: string) => void;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  modules,
  currentUser,
  onNavigateToPk,
  onNavigate,
}) => {
  const allTexts = DB.getTexts();
  const activeTexts = allTexts.filter(t => t.status === 'active');
  const totalImages = allTexts.filter(t => Boolean(t.image_url)).length;
  const recentLogs = DB.getLogs().slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0E1526] via-[#0B0B0B] to-[#0B0B0B] border border-[#1E293B] rounded-2xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SISTEM MANAJEMEN KONTEN PK AYU EKLIN SIHIITE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Poppins',sans-serif]">
            Selamat Datang, {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-2 leading-relaxed">
            Kelola modul PK, konten teks promosi/informasi, dan gambar dengan mudah. Seluruh perubahan disinkronisasikan ke database dan siap disalin instan ke aplikasi eksternal.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('pengaturan')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                <Settings className="w-4 h-4" />
                <span>Buka Manajemen PK</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('activity-log')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151515] hover:bg-[#202020] border border-[#292929] text-white text-xs font-semibold transition-colors"
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Lihat Log Aktivitas</span>
            </button>
          </div>
        </div>

        {/* Background glow decoration */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#777777] uppercase">Modul PK</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{modules.length}</p>
          <p className="text-[11px] text-[#A0A0A0] mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{modules.filter(m => m.status === 'active').length}</span> aktif di sidebar
          </p>
        </div>

        <div className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#777777] uppercase">Teks Aktif</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-[#22C55E]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{activeTexts.length}</p>
          <p className="text-[11px] text-[#A0A0A0] mt-1">
            dari total {allTexts.length} data teks
          </p>
        </div>

        <div className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#777777] uppercase">Total Gambar</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{totalImages}</p>
          <p className="text-[11px] text-[#A0A0A0] mt-1">
            terlampir dalam teks
          </p>
        </div>

        <div className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#777777] uppercase">Log Terkini</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{DB.getLogs().length}</p>
          <p className="text-[11px] text-[#A0A0A0] mt-1">
            terekam di activity audit
          </p>
        </div>
      </div>

      {/* Grid: Modul PK Shortcut Cards & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Modul PK List */}
        <div className="lg:col-span-2 bg-[#0B0B0B] border border-[#292929] rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
            <div>
              <h3 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                Daftar Modul PK
              </h3>
              <p className="text-xs text-[#A0A0A0]">
                Pilih modul untuk mengelola teks dan gambar secara spesifik.
              </p>
            </div>
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('pengaturan')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Kelola di Pengaturan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            {modules.map((m) => {
              const textsInMod = allTexts.filter(t => t.pk_id === m.id);
              const activeCount = textsInMod.filter(t => t.status === 'active').length;
              return (
                <div
                  key={m.id}
                  onClick={() => onNavigateToPk(m.id)}
                  className="p-4 rounded-xl bg-[#111111] hover:bg-[#151515] border border-[#292929] hover:border-blue-500/40 cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          {m.name_pk}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          m.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-neutral-500/10 text-[#777777] border-neutral-500/20'
                        }`}
                      >
                        {m.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-xs text-[#888888] mt-2">
                      {textsInMod.length} total teks ({activeCount} aktif siap salin)
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#222222] text-[11px] text-[#666666]">
                    <span>Update: {m.updated_at}</span>
                    <span className="text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                      Buka Modul →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Recent Activity Stream */}
        <div className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <h3 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                Aktivitas Terkini
              </h3>
              <button
                onClick={() => onNavigate('activity-log')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                Lihat Semua
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-[#111111] border border-[#222222] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-[10px] font-mono text-[#777777]">{log.timestamp}</span>
                  </div>
                  <p className="text-[#A0A0A0]">
                    Target: <span className="text-blue-400 font-mono font-medium">{log.target_pk}</span>
                  </p>
                  {log.details && (
                    <p className="text-[11px] text-[#666666] line-clamp-1">{log.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#222222] flex items-center justify-between text-[11px] text-[#777777]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sistem Audit Aktif
            </span>
            <span>Otomatis Tersimpan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
