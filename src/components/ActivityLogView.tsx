import React, { useState, useMemo } from 'react';
import { ActivityLog, User } from '../types';
import { DB } from '../lib/storage';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  User as UserIcon, 
  Clock, 
  ShieldCheck, 
  Trash2, 
  Download,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface ActivityLogViewProps {
  currentUser: User;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  currentUser,
  onRefresh,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const logs = useMemo(() => {
    return DB.getLogs();
  }, [DB.getLogs().length]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = log.user_name.toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesTarget = log.target_pk.toLowerCase().includes(q);
        const matchesDetails = (log.details || '').toLowerCase().includes(q);
        const matchesTime = log.timestamp.toLowerCase().includes(q);
        if (!matchesUser && !matchesAction && !matchesTarget && !matchesDetails && !matchesTime) {
          return false;
        }
      }
      return true;
    });
  }, [logs, actionFilter, searchQuery]);

  const actionTypes = [
    'ALL',
    'TAMBAH PK',
    'EDIT PK',
    'HAPUS PK',
    'TAMBAH TEKS',
    'EDIT TEKS',
    'UPDATE GAMBAR',
    'HAPUS GAMBAR',
    'HAPUS TEKS',
    'LOGIN',
  ];

  const getActionBadge = (action: string) => {
    if (action.includes('TAMBAH')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (action.includes('EDIT') || action.includes('UPDATE')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
    if (action.includes('HAPUS')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    return 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white font-['Poppins',sans-serif]">
                Activity Log
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1.5">
              Rekam jejak seluruh aktivitas perubahan modul PK, pembuatan/revisi teks, update gambar, dan akses pengguna.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#777777] bg-[#151515] px-3 py-1.5 rounded-lg border border-[#222222]">
              Total: {filteredLogs.length} Catatan
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4 border-t border-[#222222]">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari user, modul PK, atau aksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#151515] border border-[#292929] text-xs text-white placeholder-[#555555] focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <Filter className="w-3.5 h-3.5 text-[#777777] shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-[#151515] border border-[#292929] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {actionTypes.map((act) => (
                <option key={act} value={act}>
                  {act === 'ALL' ? 'Semua Aksi' : act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table / Timeline */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#292929] text-[11px] font-mono text-[#777777] uppercase tracking-wider bg-[#111111]/50">
                <th className="py-3 px-4 w-12 text-center">NO</th>
                <th className="py-3 px-4 w-36">USER</th>
                <th className="py-3 px-4 w-36">AKSI</th>
                <th className="py-3 px-4 w-36">TARGET PK</th>
                <th className="py-3 px-4">KETERANGAN</th>
                <th className="py-3 px-4 w-44 text-right">WAKTU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-[#777777] italic">
                    Tidak ada aktivitas yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-[#111111] transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-[#777777]">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1e1e1e] border border-[#333333] flex items-center justify-center text-[10px] text-white font-bold">
                          {log.user_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white leading-tight">{log.user_name}</p>
                          <span className="text-[9px] font-mono text-[#777777]">{log.user_role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-400">
                      {log.target_pk}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#A0A0A0]">
                      {log.details || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-[#777777]">
                      {log.timestamp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
