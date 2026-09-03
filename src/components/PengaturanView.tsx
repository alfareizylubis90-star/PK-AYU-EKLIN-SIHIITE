import React, { useState, useEffect } from 'react';
import { PKModule, User } from '../types';
import { DB, formatDateTime, formatDateOnly, copyToClipboard } from '../lib/storage';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Globe, 
  ShieldAlert, 
  Check, 
  X, 
  RefreshCw, 
  Database,
  Layers,
  Info,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Code,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  GoogleSheetDB, 
  SheetConnectionStatus, 
  SheetTestResult, 
  DEFAULT_SHEET_URL 
} from '../lib/googleSheetDb';

interface PengaturanViewProps {
  modules: PKModule[];
  currentUser: User;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  modules,
  currentUser,
  onRefresh,
  showToast,
}) => {
  // Add PK Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [namePkInput, setNamePkInput] = useState('');
  const [statusInput, setStatusInput] = useState<'active' | 'inactive'>('active');

  // Edit PK Modal state
  const [editingModule, setEditingModule] = useState<PKModule | null>(null);
  const [editNamePk, setEditNamePk] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  // Delete PK confirmation modal
  const [deletingModule, setDeletingModule] = useState<PKModule | null>(null);

  // Google Sheet Database state
  const [sheetUrl, setSheetUrl] = useState<string>(() => GoogleSheetDB.getUrl());
  const [sheetStatus, setSheetStatus] = useState<SheetConnectionStatus>('idle');
  const [testResult, setTestResult] = useState<SheetTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>(() => GoogleSheetDB.getLastSync());
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isCopiedScript, setIsCopiedScript] = useState(false);
  const [isCopiedUrl, setIsCopiedUrl] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  // Listen to sheet config updates
  useEffect(() => {
    const handleConfigUpdate = () => {
      setSheetUrl(GoogleSheetDB.getUrl());
      setLastSync(GoogleSheetDB.getLastSync());
    };
    window.addEventListener('pk_sheet_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('pk_sheet_config_updated', handleConfigUpdate);
  }, []);

  // Run a connection check on initial view open
  useEffect(() => {
    let isMounted = true;
    GoogleSheetDB.testConnection().then((res) => {
      if (isMounted) {
        setSheetStatus(res.status);
        setTestResult(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save modified URL
  const handleSaveSheetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('error', 'Hanya ADMIN yang diizinkan mengubah URL database.');
      return;
    }
    const trimmed = sheetUrl.trim();
    if (!trimmed) {
      showToast('error', 'URL Google Apps Script tidak boleh kosong.');
      return;
    }
    GoogleSheetDB.setUrl(trimmed);
    showToast('success', 'URL Database Google Sheet berhasil disimpan.');
    handleTestConnection(trimmed);
  };

  // Reset to initial URL provided by user
  const handleResetSheetUrl = () => {
    if (!isAdmin) return;
    GoogleSheetDB.resetToDefaultUrl();
    setSheetUrl(DEFAULT_SHEET_URL);
    showToast('info', 'URL Database dikembalikan ke default.');
    handleTestConnection(DEFAULT_SHEET_URL);
  };

  // Test connection
  const handleTestConnection = async (targetUrl?: string) => {
    setIsTesting(true);
    setSheetStatus('testing');
    const res = await GoogleSheetDB.testConnection(targetUrl || sheetUrl);
    setIsTesting(false);
    setSheetStatus(res.status);
    setTestResult(res);

    if (res.success) {
      showToast('success', `Koneksi berhasil! Latensi: ${res.latency}ms`);
    } else if (res.status === 'needs_setup') {
      showToast('info', 'Google Apps Script online! Silakan pasang ID Spreadsheet di Apps Script.');
    } else {
      showToast('error', res.message);
    }
  };

  // Pull data from Google Sheet into local DB
  const handlePullFromSheet = async () => {
    setIsSyncing(true);
    setSheetStatus('syncing');
    showToast('info', 'Menghubungi Google Sheet untuk mengambil data terbaru...');

    const res = await GoogleSheetDB.pullData();
    setIsSyncing(false);
    setLastSync(GoogleSheetDB.getLastSync());

    if (res.success) {
      setSheetStatus('connected');
      onRefresh();
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
      // Recheck status
      handleTestConnection();
    }
  };

  // Push local data to Google Sheet
  const handlePushToSheet = async () => {
    if (!isAdmin) {
      showToast('error', 'Hanya ADMIN yang dapat mengunggah data ke Google Sheet.');
      return;
    }
    setIsSyncing(true);
    setSheetStatus('syncing');
    showToast('info', 'Mengunggah data PK dan Teks ke Google Sheet...');

    const res = await GoogleSheetDB.pushData();
    setIsSyncing(false);
    setLastSync(GoogleSheetDB.getLastSync());

    if (res.success) {
      setSheetStatus('connected');
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  // Copy Script code to clipboard
  const handleCopyCode = async () => {
    const success = await copyToClipboard(GoogleSheetDB.getAppsScriptCode());
    if (success) {
      setIsCopiedScript(true);
      showToast('success', 'Kode Google Apps Script (Code.gs) berhasil disalin!');
      setTimeout(() => setIsCopiedScript(false), 2500);
    } else {
      showToast('error', 'Gagal menyalin kode ke clipboard.');
    }
  };

  // Copy URL
  const handleCopyUrl = async () => {
    const success = await copyToClipboard(sheetUrl);
    if (success) {
      setIsCopiedUrl(true);
      showToast('success', 'URL Google Apps Script berhasil disalin!');
      setTimeout(() => setIsCopiedUrl(false), 2000);
    }
  };

  // Handle Add PK
  const handleCreatePK = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('error', 'Hanya ADMIN yang diizinkan menambah PK.');
      return;
    }

    const trimmed = namePkInput.trim();
    if (!trimmed) {
      showToast('error', 'Nama PK tidak boleh kosong.');
      return;
    }

    // Check duplicate
    const exists = modules.some(
      (m) => m.name_pk.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      showToast('error', `Modul ${trimmed} sudah terdaftar di database.`);
      return;
    }

    const newModule: PKModule = {
      id: `pk-${Date.now()}`,
      name_pk: trimmed,
      status: statusInput,
      created_at: formatDateTime(new Date()),
      updated_at: formatDateTime(new Date()),
      created_by: currentUser.name,
    };

    DB.saveModule(newModule);
    DB.addLog(currentUser.name, currentUser.role, 'TAMBAH PK', trimmed, `Membuat modul PK baru "${trimmed}" dengan status ${statusInput}`);

    showToast('success', `✅ Modul ${trimmed} berhasil dibuat.`);
    setNamePkInput('');
    setStatusInput('active');
    setIsAddModalOpen(false);
    onRefresh();
  };

  // Open Edit Modal
  const openEditModal = (module: PKModule) => {
    if (!isAdmin) {
      showToast('error', 'Hanya ADMIN yang diizinkan mengubah PK.');
      return;
    }
    setEditingModule(module);
    setEditNamePk(module.name_pk);
    setEditStatus(module.status);
  };

  // Handle Update PK
  const handleUpdatePK = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !isAdmin) return;

    const trimmed = editNamePk.trim();
    if (!trimmed) {
      showToast('error', 'Nama PK tidak boleh kosong.');
      return;
    }

    const oldName = editingModule.name_pk;
    const updated: PKModule = {
      ...editingModule,
      name_pk: trimmed,
      status: editStatus,
      updated_at: formatDateTime(new Date()),
    };

    DB.saveModule(updated);
    DB.addLog(
      currentUser.name,
      currentUser.role,
      'EDIT PK',
      trimmed,
      `Memperbarui modul PK dari "${oldName}" status ${editStatus}`
    );

    showToast('success', `✅ Modul PK berhasil diperbarui.`);
    setEditingModule(null);
    onRefresh();
  };

  // Handle Delete PK
  const handleConfirmDelete = () => {
    if (!deletingModule || !isAdmin) return;
    const targetName = deletingModule.name_pk;

    DB.deleteModule(deletingModule.id);
    DB.addLog(currentUser.name, currentUser.role, 'HAPUS PK', targetName, `Menghapus modul PK "${targetName}" berserta teks terkait`);

    showToast('success', `✅ Modul ${targetName} berhasil dihapus.`);
    setDeletingModule(null);
    onRefresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Breadcrumb */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Poppins',sans-serif]">
          ⚙️ Pengaturan Sistem
        </h2>
        <p className="text-sm text-[#A0A0A0] mt-1">
          Pusat konfigurasi sistem, kontrol akses, dan manajemen modul PK SHIITE.
        </p>
      </div>

      {/* SECTION: MANAJEMEN PK */}
      <section className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#292929]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white font-['Poppins',sans-serif]">
                MANAJEMEN PK
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1.5 max-w-2xl">
              Kelola daftar modul PK yang tersedia pada dashboard. Menu sidebar akan otomatis menyesuaikan dengan daftar PK di bawah ini.
            </p>
          </div>

          {/* Button Tambah PK (Admin Only) */}
          {isAdmin ? (
            <button
              id="btn-tambah-pk"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ TAMBAH PK</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#151515] border border-[#222222] text-xs text-[#777777]">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Khusus ADMIN untuk Menambah/Mengubah PK</span>
            </div>
          )}
        </div>

        {/* Table of PK Modules */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#292929] text-[11px] font-mono text-[#777777] uppercase tracking-wider bg-[#111111]/50">
                <th className="py-3 px-4 w-12 text-center">NO</th>
                <th className="py-3 px-4">NAME PK</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">DIBUAT</th>
                <th className="py-3 px-4">TERAKHIR UPDATE</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {modules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#777777] italic">
                    Belum ada modul PK yang terdaftar. Klik [+ TAMBAH PK] untuk membuat modul baru.
                  </td>
                </tr>
              ) : (
                modules.map((m, index) => {
                  const isActive = m.status === 'active';
                  return (
                    <tr key={m.id} className="hover:bg-[#111111] transition-colors group">
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-[#777777]">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{m.name_pk}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            isActive
                              ? 'bg-emerald-500/10 text-[#22C55E] border-emerald-500/20'
                              : 'bg-neutral-500/10 text-[#A0A0A0] border-neutral-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-[#22C55E]' : 'bg-[#A0A0A0]'
                            }`}
                          />
                          {isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#A0A0A0] font-mono">
                        {m.created_at}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#A0A0A0] font-mono">
                        {m.updated_at}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              id={`btn-edit-pk-${m.id}`}
                              onClick={() => openEditModal(m)}
                              className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all"
                              title="Edit PK"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-delete-pk-${m.id}`}
                              onClick={() => setDeletingModule(m)}
                              className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                              title="Hapus PK"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#666666] font-mono">Read Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Informative notice */}
        <div className="mt-5 p-3 rounded-xl bg-[#111111] border border-[#222222] flex items-start gap-2.5 text-xs text-[#888888] leading-relaxed">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            <strong>Prinsip Arsitektur:</strong> Penambahan dan perubahan nama/status PK dilakukan di sini.
            Setiap modul PK yang dibuat otomatis menjadi menu di sidebar dan digunakan khusus untuk mengelola konten teks dan gambar.
          </span>
        </div>
      </section>

      {/* SECTION: GOOGLE SHEET DOCS DATABASE */}
      <section className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#292929] relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Poppins',sans-serif] flex items-center gap-2">
                  DATABASE DOC SHEET (GOOGLE SPREADSHEET)
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Web App
                  </span>
                </h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1.5 max-w-2xl">
              Sinkronisasi data modul PK, teks pengumuman, gambar, dan log aktivitas secara real-time dengan Google Sheets melalui Google Apps Script Web App.
            </p>
          </div>

          {/* Current Status Pill */}
          <div className="flex items-center gap-2 shrink-0">
            {sheetStatus === 'connected' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Terhubung Online</span>
              </div>
            )}
            {sheetStatus === 'needs_setup' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Perlu ID Spreadsheet</span>
              </div>
            )}
            {(sheetStatus === 'testing' || sheetStatus === 'syncing') && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{sheetStatus === 'testing' ? 'Menguji Respon...' : 'Sinkronisasi Data...'}</span>
              </div>
            )}
            {sheetStatus === 'error' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Koneksi Terputus</span>
              </div>
            )}
            {sheetStatus === 'idle' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800 border border-[#333333] text-[#A0A0A0] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                <span>Belum Diuji</span>
              </div>
            )}
          </div>
        </div>

        {/* URL Input Form */}
        <div className="mt-5 space-y-4">
          <form onSubmit={handleSaveSheetUrl} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-[#A0A0A0] flex items-center gap-1.5">
                <span>URL WEB APP GOOGLE APPS SCRIPT (EXEC):</span>
                {sheetUrl === DEFAULT_SHEET_URL && (
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-sans">
                    URL Terkait
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="text-[#A0A0A0] hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopiedUrl ? 'Tersalin!' : 'Salin URL'}</span>
                </button>
                {sheetUrl !== DEFAULT_SHEET_URL && isAdmin && (
                  <button
                    type="button"
                    onClick={handleResetSheetUrl}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors ml-2"
                  >
                    <span>Reset ke URL Asal</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                disabled={!isAdmin}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-[#111111] border border-[#292929] focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono placeholder:text-[#555555] outline-none transition-all"
              />

              {isAdmin && sheetUrl !== GoogleSheetDB.getUrl() && (
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all shrink-0"
                >
                  Simpan URL
                </button>
              )}
            </div>
          </form>

          {/* Live Diagnostics Alert Banner */}
          {testResult && testResult.status === 'needs_setup' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-white font-['Poppins',sans-serif]">
                    Google Apps Script Online, Namun Butuh ID Google Sheet:
                  </p>
                  <p className="text-amber-300/90 leading-relaxed text-xs">
                    Endpoint URL yang Anda berikan telah merespon dengan baik! Namun di dalam kode skrip <code>Code.gs</code> di Google Apps Script Anda, variabel <code>SPREADSHEET_ID</code> masih bernilai default: <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200">"MASUKKAN_ID_SPREADSHEET_KAMU"</code>.
                  </p>
                  <p className="text-[#A0A0A0] text-xs">
                    Buka Google Apps Script Anda (menu <em>Ekstensi &gt; Apps Script</em> di Google Sheets), ganti ID tersebut dengan ID Spreadsheet Anda, lalu simpan dan buat Deployment baru.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setIsScriptModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Lihat / Salin Kode Skrip (Code.gs) Lengkap</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTestConnection()}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cek Ulang Koneksi</span>
                </button>
              </div>
            </div>
          )}

          {testResult && testResult.status === 'connected' && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Endpoint Aktif & Terhubung:</strong> Terhubung sempurna ke Google Sheet. Latensi respon: <strong>{testResult.latency} ms</strong>.
                </span>
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono shrink-0">
                Siap Sinkron
              </span>
            </div>
          )}

          {testResult && testResult.status === 'error' && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-rose-200">Koneksi Bermasalah:</span>
                <p className="text-xs text-rose-300/90">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#222222]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-uji-koneksi-sheet"
                disabled={isTesting || isSyncing}
                onClick={() => handleTestConnection()}
                className="px-3.5 py-2 rounded-xl bg-[#151515] hover:bg-[#202020] border border-[#333333] hover:border-emerald-500/50 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Menguji...' : 'Uji Koneksi Endpoint'}</span>
              </button>

              <button
                type="button"
                id="btn-tarik-data-sheet"
                disabled={isTesting || isSyncing}
                onClick={handlePullFromSheet}
                className="px-3.5 py-2 rounded-xl bg-[#151515] hover:bg-[#202020] border border-[#333333] hover:border-blue-500/50 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                title="Ambil data dari Google Sheet ke sistem"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Tarik Data (Pull)</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  id="btn-unggah-data-sheet"
                  disabled={isTesting || isSyncing}
                  onClick={handlePushToSheet}
                  className="px-3.5 py-2 rounded-xl bg-[#151515] hover:bg-[#202020] border border-[#333333] hover:border-purple-500/50 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  title="Unggah data sistem ke Google Sheet"
                >
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Kirim Data (Push)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsScriptModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold inline-flex items-center gap-2 transition-all"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Panduan & Skrip (Code.gs)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#777777] font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Terakhir Sinkron: {lastSync}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: DATABASE & SISTEM INFO */}
      <section className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300 border border-[#333333]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                Status Database & Penyimpanan
              </h3>
              <p className="text-xs text-[#A0A0A0]">
                Tabel PK_MODULES dan PK_TEXTS terpisah dan terhubung relasional via pk_id.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                if (confirm('Kembalikan data ke awal (default seed PK%20BOLA dan PK SPORT)?')) {
                  DB.resetToDefault();
                  onRefresh();
                  showToast('info', 'Data berhasil direset ke konfigurasi awal.');
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-[#333333] hover:border-amber-500/50 bg-[#151515] hover:bg-amber-500/10 text-xs text-[#A0A0A0] hover:text-amber-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data Demo</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
            <span className="text-xs font-mono text-[#777777]">RELASI TABEL</span>
            <p className="text-sm font-semibold text-white mt-1">PK_MODULES.id → PK_TEXTS.pk_id</p>
            <p className="text-xs text-[#888888] mt-1">Teks tetap utuh meskipun nama PK disesuaikan.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
            <span className="text-xs font-mono text-[#777777]">MODUL TERDAFTAR</span>
            <p className="text-lg font-bold text-white mt-1">{modules.length} Modul</p>
            <p className="text-xs text-[#888888] mt-1">
              {modules.filter(m => m.status === 'active').length} Aktif, {modules.filter(m => m.status === 'inactive').length} Nonaktif
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
            <span className="text-xs font-mono text-[#777777]">AUDIT TRAIL</span>
            <p className="text-sm font-semibold text-emerald-400 mt-1">Activity Log Aktif</p>
            <p className="text-xs text-[#888888] mt-1">Semua aksi penambahan dan perubahan tercatat.</p>
          </div>
        </div>
      </section>

      {/* ================= MODAL TAMBAH PK BARU ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#292929] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <h4 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                  TAMBAH PK BARU
                </h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#A0A0A0] hover:text-white p-1 rounded-lg hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePK} className="mt-5 space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">
                  NAME PK <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PK CASINO, PK GAMES, PK SPORT"
                  value={namePkInput}
                  onChange={(e) => setNamePkInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151515] border border-[#292929] text-white text-sm placeholder-[#555555] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <p className="text-[11px] text-[#666666] mt-1.5">
                  Nama ini akan otomatis ditampilkan sebagai menu di sidebar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">
                  STATUS
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatusInput('active')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      statusInput === 'active'
                        ? 'bg-emerald-500/15 text-[#22C55E] border-emerald-500/40 shadow-sm'
                        : 'bg-[#151515] text-[#A0A0A0] border-[#292929] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusInput('inactive')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      statusInput === 'inactive'
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-sm'
                        : 'bg-[#151515] text-[#A0A0A0] border-[#292929] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Nonaktif
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#222222] text-[11px] text-[#777777] leading-relaxed">
                ℹ️ <strong>Catatan:</strong> Form ini khusus untuk membuat identitas modul PK.
                Pengisian teks dan upload gambar dilakukan di dalam masing-masing menu PK setelah dibuat.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#292929] bg-[#151515] hover:bg-[#1a1a1a] text-[#A0A0A0] hover:text-white text-xs font-semibold transition-colors"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  SIMPAN PK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT PK ================= */}
      {editingModule && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#292929] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" />
                <h4 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                  EDIT PK: {editingModule.name_pk}
                </h4>
              </div>
              <button
                onClick={() => setEditingModule(null)}
                className="text-[#A0A0A0] hover:text-white p-1 rounded-lg hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePK} className="mt-5 space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">
                  NAME PK <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editNamePk}
                  onChange={(e) => setEditNamePk(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151515] border border-[#292929] text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">
                  STATUS
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditStatus('active')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      editStatus === 'active'
                        ? 'bg-emerald-500/15 text-[#22C55E] border-emerald-500/40 shadow-sm'
                        : 'bg-[#151515] text-[#A0A0A0] border-[#292929] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('inactive')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      editStatus === 'inactive'
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-sm'
                        : 'bg-[#151515] text-[#A0A0A0] border-[#292929] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Nonaktif
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#292929] bg-[#151515] hover:bg-[#1a1a1a] text-[#A0A0A0] hover:text-white text-xs font-semibold transition-colors"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  SIMPAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS PK ================= */}
      {deletingModule && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#292929] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-[#292929]">
              <Trash2 className="w-6 h-6" />
              <h4 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                Hapus Modul PK?
              </h4>
            </div>

            <p className="text-sm text-[#A0A0A0] mt-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus modul <strong className="text-white">"{deletingModule.name_pk}"</strong>?
              Semua teks dan data terkait di dalam modul ini akan dihapus dari sistem.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#292929]">
              <button
                onClick={() => setDeletingModule(null)}
                className="px-4 py-2 rounded-xl border border-[#292929] bg-[#151515] hover:bg-[#1a1a1a] text-[#A0A0A0] hover:text-white text-xs font-semibold transition-colors"
              >
                BATAL
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all"
              >
                HAPUS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KODE & PANDUAN APPS SCRIPT ================= */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-[#111111] border border-[#292929] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#292929] bg-[#0E0E0E]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                    Kode Skrip Google Apps Script (Code.gs)
                  </h4>
                  <p className="text-xs text-[#A0A0A0]">
                    Salin kode ini ke Google Apps Script Spreadsheet Anda untuk sinkronisasi penuh.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm text-[#CCCCCC]">
              {/* Step by step guide */}
              <div className="p-4 rounded-xl bg-[#161616] border border-[#292929] space-y-3">
                <h5 className="font-semibold text-white flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  Langkah-Langkah Menghubungkan Google Sheet:
                </h5>
                <ol className="list-decimal list-inside space-y-2 text-xs text-[#A0A0A0] leading-relaxed">
                  <li>
                    Buka spreadsheet Google Sheets Anda (atau buat baru di{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline hover:text-emerald-300 inline-flex items-center gap-0.5"
                    >
                      sheets.new <ExternalLink className="w-3 h-3 inline" />
                    </a>
                    ).
                  </li>
                  <li>
                    Salin <strong>ID Spreadsheet</strong> dari URL browser Anda. Contoh:
                    <br />
                    <code className="text-xs text-white bg-black/60 px-2 py-0.5 rounded border border-[#333333] mt-1 inline-block">
                      https://docs.google.com/spreadsheets/d/<strong>[ID_SPREADSHEET_DISINI]</strong>/edit
                    </code>
                  </li>
                  <li>
                    Di Google Sheets, klik menu <strong>Ekstensi &gt; Apps Script</strong>.
                  </li>
                  <li>
                    Hapus kode yang ada di file <code>Code.gs</code>, lalu tempelkan seluruh kode skrip di bawah ini.
                  </li>
                  <li>
                    Ganti teks <code className="text-amber-400 font-bold bg-amber-500/10 px-1 py-0.5 rounded">"MASUKKAN_ID_SPREADSHEET_KAMU"</code> dengan ID Spreadsheet Anda.
                  </li>
                  <li>
                    Klik <strong>Deploy &gt; New deployment</strong>, pilih jenis <strong>Web app</strong>:
                    <ul className="list-disc list-inside ml-4 mt-1 text-[11px] text-[#888888] space-y-0.5">
                      <li>Execute as: <strong>Me (email Anda)</strong></li>
                      <li>Who has access: <strong>Anyone</strong> (Siapa saja)</li>
                    </ul>
                  </li>
                  <li>
                    Salin <strong>Web App URL</strong> yang dihasilkan (berakhiran <code>/exec</code>) dan masukkan ke kolom URL di atas.
                  </li>
                </ol>
              </div>

              {/* Code Box */}
              <div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-mono text-[#888888]">FILE: Code.gs</span>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    {isCopiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Seluruh Kode</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative rounded-xl border border-[#292929] bg-[#0A0A0A] p-4 overflow-x-auto max-h-72">
                  <pre className="text-xs font-mono text-[#22C55E] whitespace-pre leading-relaxed">
                    {GoogleSheetDB.getAppsScriptCode()}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#292929] bg-[#0E0E0E] flex items-center justify-between">
              <span className="text-xs text-[#777777]">
                Backend Google Apps Script terintegrasi penuh dengan auto-create sheet.
              </span>
              <button
                type="button"
                onClick={() => setIsScriptModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] text-white text-xs font-semibold border border-[#333333] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
