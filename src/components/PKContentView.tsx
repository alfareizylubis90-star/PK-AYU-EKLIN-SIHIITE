import React, { useState, useMemo, useRef } from 'react';
import { PKModule, PKText, User } from '../types';
import { DB, formatDateTime, copyToClipboard } from '../lib/storage';
import { 
  Copy, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Check, 
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  ExternalLink,
  LayoutGrid,
  List
} from 'lucide-react';

interface PKContentViewProps {
  module: PKModule;
  currentUser: User;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const PKContentView: React.FC<PKContentViewProps> = ({
  module,
  currentUser,
  onRefresh,
  showToast,
}) => {
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  // View mode: 'grid' (Tampilan Petak) as default, or 'table' (Tampilan Tabel)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingText, setEditingText] = useState<PKText | null>(null);
  const [detailText, setDetailText] = useState<PKText | null>(null);
  const [deletingText, setDeletingText] = useState<PKText | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  // Form states for Add Text
  const [newTextTitle, setNewTextTitle] = useState('');
  const [newTextContent, setNewTextContent] = useState('');
  const [newTextStatus, setNewTextStatus] = useState<'active' | 'inactive'>('active');
  const [newImageBase64, setNewImageBase64] = useState<string>('');
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Form states for Edit Text
  const [editTextTitle, setEditTextTitle] = useState('');
  const [editTextContent, setEditTextContent] = useState('');
  const [editTextStatus, setEditTextStatus] = useState<'active' | 'inactive'>('active');
  const [editImageBase64, setEditImageBase64] = useState<string>('');
  const [isImageReplaced, setIsImageReplaced] = useState(false);
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // User permissions check
  const isAdmin = currentUser.role === 'ADMIN';
  const isStaff = currentUser.role === 'STAFF';
  const isUser = currentUser.role === 'USER';

  const canAdd = isAdmin || (isStaff && currentUser.permissions.canAddText);
  const canEdit = isAdmin || (isStaff && currentUser.permissions.canEditText);
  const canDelete = isAdmin; // Only ADMIN can delete
  const canUpdateImg = isAdmin || (isStaff && currentUser.permissions.canUpdateImage);

  // Get texts for this module
  const allTexts = useMemo(() => {
    return DB.getTexts(module.id);
  }, [module.id]);

  // Filtered texts
  const filteredTexts = useMemo(() => {
    return allTexts.filter((item) => {
      // Role USER only sees active texts unless stated otherwise
      if (isUser && item.status !== 'active') {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Search query: judul, isi teks, tanggal update, status
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title ? item.title.toLowerCase().includes(query) : false;
        const matchesText = item.text.toLowerCase().includes(query);
        const matchesDate = item.updated_at.toLowerCase().includes(query) || item.created_at.toLowerCase().includes(query);
        const matchesStatus = (item.status === 'active' ? 'aktif' : 'nonaktif').includes(query);
        if (!matchesTitle && !matchesText && !matchesDate && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [allTexts, isUser, statusFilter, searchQuery]);

  // Active texts for Copy All
  const activeTexts = useMemo(() => {
    return allTexts.filter((t) => t.status === 'active');
  }, [allTexts]);

  // Handle Copy Single Text
  const handleCopySingle = async (text: string, id?: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
      showToast('success', '✅ Teks berhasil disalin!');
    } else {
      showToast('error', 'Tekan dan tahan untuk menyalin teks.');
    }
  };

  // Handle Copy All Active Texts
  const handleCopyAll = async () => {
    if (activeTexts.length === 0) {
      showToast('info', 'Tidak ada teks aktif untuk disalin.');
      return;
    }

    const formatted = activeTexts
      .map((item, index) => `TEKS ${index + 1}\n\n${item.text}`)
      .join('\n\n====================\n\n');

    const success = await copyToClipboard(formatted);
    if (success) {
      showToast('success', '✅ Semua teks berhasil disalin.');
    } else {
      showToast('error', 'Tekan dan tahan untuk menyalin teks.');
    }
  };

  // Image upload validator
  const handleImageFile = (
    file: File,
    onSuccess: (dataUrl: string) => void
  ) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('error', 'Format gambar harus JPG, JPEG, PNG, atau WEBP.');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      showToast('error', 'Ukuran gambar maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onSuccess(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Submit Add Text
  const handleAddTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      showToast('error', 'Anda tidak memiliki izin untuk menambah teks.');
      return;
    }

    const trimmed = newTextContent.trim();
    if (!trimmed) {
      showToast('error', 'Isi teks tidak boleh kosong.');
      return;
    }

    const newTextItem: PKText = {
      id: `txt-${Date.now()}`,
      pk_id: module.id,
      title: newTextTitle.trim() || undefined,
      text: trimmed,
      image_url: newImageBase64 || undefined,
      image_id: newImageBase64 ? `img-${Date.now()}` : undefined,
      status: newTextStatus,
      created_at: formatDateTime(new Date()),
      updated_at: formatDateTime(new Date()),
      created_by: currentUser.name,
    };

    DB.saveText(newTextItem);
    DB.addLog(
      currentUser.name,
      currentUser.role,
      'TAMBAH TEKS',
      module.name_pk,
      `Menambahkan teks baru ${newTextTitle.trim() ? `"${newTextTitle.trim()}" ` : ''}(${trimmed.slice(0, 35)}...) status ${newTextStatus}`
    );

    showToast('success', '✅ Teks berhasil disimpan.');
    setNewTextTitle('');
    setNewTextContent('');
    setNewTextStatus('active');
    setNewImageBase64('');
    setIsAddModalOpen(false);
    onRefresh();
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PKText) => {
    if (!canEdit) {
      showToast('error', 'Anda tidak memiliki izin untuk mengedit teks.');
      return;
    }
    setEditingText(item);
    setEditTextTitle(item.title || '');
    setEditTextContent(item.text);
    setEditTextStatus(item.status);
    setEditImageBase64(item.image_url || '');
    setIsImageReplaced(false);
    setIsImageRemoved(false);
  };

  // Handle Submit Edit Text
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingText || !canEdit) return;

    const trimmed = editTextContent.trim();
    if (!trimmed) {
      showToast('error', 'Isi teks tidak boleh kosong.');
      return;
    }

    let finalImageUrl = editingText.image_url;
    if (isImageRemoved) {
      finalImageUrl = undefined;
    } else if (isImageReplaced) {
      finalImageUrl = editImageBase64;
    }

    const updatedItem: PKText = {
      ...editingText,
      title: editTextTitle.trim() || undefined,
      text: trimmed,
      image_url: finalImageUrl,
      image_id: isImageRemoved ? undefined : isImageReplaced ? `img-${Date.now()}` : editingText.image_id,
      status: editTextStatus,
      updated_at: formatDateTime(new Date()),
    };

    DB.saveText(updatedItem);

    // Activity log details
    if (isImageReplaced) {
      DB.addLog(
        currentUser.name,
        currentUser.role,
        'UPDATE GAMBAR',
        module.name_pk,
        `Memperbarui gambar untuk teks ID ${editingText.id}`
      );
    } else if (isImageRemoved) {
      DB.addLog(
        currentUser.name,
        currentUser.role,
        'HAPUS GAMBAR',
        module.name_pk,
        `Menghapus gambar dari teks ID ${editingText.id}`
      );
    }

    DB.addLog(
      currentUser.name,
      currentUser.role,
      'EDIT TEKS',
      module.name_pk,
      `Memperbarui isi teks ID ${editingText.id} status ${editTextStatus}`
    );

    if (isImageReplaced) {
      showToast('success', '✅ Gambar dan teks berhasil diperbarui.');
    } else {
      showToast('success', '✅ Teks berhasil diperbarui.');
    }

    setEditingText(null);
    onRefresh();
  };

  // Handle Delete Confirm
  const handleConfirmDeleteText = () => {
    if (!deletingText || !canDelete) return;

    DB.deleteText(deletingText.id);
    DB.addLog(
      currentUser.name,
      currentUser.role,
      'HAPUS TEKS',
      module.name_pk,
      `Menghapus teks ID ${deletingText.id} (${deletingText.text.slice(0, 30)}...)`
    );

    showToast('success', '✅ Teks berhasil dihapus.');
    setDeletingText(null);
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 5. MENU PK HEADER */}
      <div className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Poppins',sans-serif]">
                {module.name_pk}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  module.status === 'active'
                    ? 'bg-emerald-500/15 text-[#22C55E] border-emerald-500/30'
                    : 'bg-neutral-500/15 text-[#A0A0A0] border-neutral-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    module.status === 'active' ? 'bg-[#22C55E]' : 'bg-[#A0A0A0]'
                  }`}
                />
                {module.status === 'active' ? 'Modul Aktif' : 'Modul Nonaktif'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1.5">
              Kelola konten teks dan gambar untuk modul <span className="text-white font-semibold">{module.name_pk}</span>.
            </p>
          </div>

          {/* Action Header Buttons: SALIN SEMUA & TAMBAH TEKS */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 16. COPY SEMUA TEKS */}
            <button
              id="btn-copy-all-texts"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#151515] hover:bg-[#202020] text-white border border-[#292929] text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Salin seluruh teks aktif pada modul ini"
            >
              <Copy className="w-4 h-4 text-blue-400" />
              <span>📋 SALIN SEMUA ({activeTexts.length})</span>
            </button>

            {/* 6. TAMBAH TEKS */}
            {canAdd && (
              <button
                id="btn-add-text"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ TAMBAH TEKS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6. DAFTAR TEKS SECTION */}
      <section className="bg-[#0B0B0B] border border-[#292929] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#292929]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                DAFTAR TEKS
              </h3>
              <p className="text-xs text-[#A0A0A0]">
                Total {filteredTexts.length} data ditampilkan
              </p>
            </div>
          </div>

          {/* 14. SEARCH TEKS & 15. FILTER */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Realtime */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Cari teks..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#151515] border border-[#292929] text-xs text-white placeholder-[#555555] focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills: SEMUA / AKTIF / NONAKTIF */}
            <div className="flex items-center bg-[#151515] p-1 rounded-xl border border-[#292929]">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-[#252525] text-white shadow-sm'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                SEMUA
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'active'
                    ? 'bg-emerald-500/20 text-[#22C55E] shadow-sm'
                    : 'text-[#888888] hover:text-[#22C55E]'
                }`}
              >
                AKTIF
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'inactive'
                    ? 'bg-neutral-500/20 text-neutral-300 shadow-sm'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                NONAKTIF
              </button>
            </div>

            {/* View Mode Switcher: PETAK (Grid) vs TABEL */}
            <div className="flex items-center bg-[#151515] p-1 rounded-xl border border-[#292929]">
              <button
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-[#888888] hover:text-white'
                }`}
                title="Tampilan Petak (Grid / Tiles)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Petak</span>
              </button>
              <button
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-[#888888] hover:text-white'
                }`}
                title="Tampilan Tabel (Baris)"
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabel</span>
              </button>
            </div>
          </div>
        </div>

        {/* 25. EMPTY STATE */}
        {filteredTexts.length === 0 ? (
          <div className="py-14 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#151515] border border-[#292929] flex items-center justify-center text-3xl mb-3 shadow-inner">
              📄
            </div>
            <h4 className="text-base font-bold text-white font-['Poppins',sans-serif]">
              BELUM ADA TEKS
            </h4>
            <p className="text-xs text-[#A0A0A0] mt-1 max-w-sm">
              Belum ada konten teks untuk PK ini.
            </p>
            {canAdd && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>+ TAMBAH TEKS</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ================= 26A. TAMPILAN PETAK (GRID VIEW) ================= */
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredTexts.map((item, index) => {
              const isLongText = item.text.length > 140;
              const truncatedText = isLongText ? item.text.slice(0, 140) + '...' : item.text;
              const isActive = item.status === 'active';
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-[#111111] hover:bg-[#141414] border border-[#262626] hover:border-blue-500/50 rounded-2xl p-4 sm:p-5 transition-all shadow-lg flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Header Petak: Nomor & Status */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#202020]">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#181818] border border-[#2d2d2d] text-xs font-mono font-bold text-blue-400">
                          PETAK #{index + 1}
                        </span>
                        <span className="text-[10px] font-mono text-[#666666]">
                          {item.text.length} kar
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-emerald-500/10 text-[#22C55E] border-emerald-500/30'
                            : 'bg-neutral-500/10 text-[#A0A0A0] border-neutral-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-[#22C55E]' : 'bg-[#A0A0A0]'
                          }`}
                        />
                        {isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    {/* Judul Petak (jika ada) */}
                    {item.title && (
                      <div className="mt-3 flex items-start gap-1.5 px-0.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight line-clamp-2">
                          {item.title}
                        </h4>
                      </div>
                    )}

                    {/* Gambar Lampiran (jika ada) */}
                    {item.image_url && (
                      <div className="mt-3 relative rounded-xl overflow-hidden border border-[#252525] bg-[#0d0d0d] group/img">
                        <img
                          src={item.image_url}
                          alt="Lampiran"
                          className="w-full h-36 sm:h-40 object-cover transition-transform duration-300 group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                          <span className="text-[10px] text-neutral-300 font-mono">Lampiran Gambar</span>
                          <button
                            onClick={() => setImageModalUrl(item.image_url || null)}
                            className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium flex items-center gap-1 shadow-md"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Perbesar</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Teks Box Konten */}
                    <div className="mt-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-3.5 relative">
                      <p className="text-white text-xs leading-relaxed whitespace-pre-line break-words select-text font-normal">
                        {truncatedText}
                      </p>
                      {isLongText && (
                        <button
                          onClick={() => setDetailText(item)}
                          className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Lihat Selengkapnya</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Footer Petak: Tombol Salin & Aksi */}
                  <div className="mt-4 pt-3 border-t border-[#202020] space-y-2.5">
                    {/* Tombol Salin Utama */}
                    <button
                      id={`btn-copy-petak-${item.id}`}
                      onClick={() => handleCopySingle(item.title ? `${item.title}\n\n${item.text}` : item.text, item.id)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 hover:border-blue-500 shadow-sm'
                      }`}
                      title="Salin isi teks ini ke clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 text-white animate-in zoom-in" />
                          <span>✓ TEKS TERSALIN!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>📋 SALIN TEKS</span>
                        </>
                      )}
                    </button>

                    {/* Meta info & aksi edit/hapus */}
                    <div className="flex items-center justify-between text-[11px] text-[#777777]">
                      <span className="font-mono text-[10px] truncate">
                        {item.updated_at}
                      </span>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <button
                            id={`btn-edit-petak-${item.id}`}
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-[#999999] hover:text-blue-400 hover:bg-[#1a1a1a] transition-all"
                            title="Edit Teks"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            id={`btn-delete-petak-${item.id}`}
                            onClick={() => setDeletingText(item)}
                            className="p-1.5 rounded-lg text-[#999999] hover:text-rose-400 hover:bg-[#1a1a1a] transition-all"
                            title="Hapus Teks"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= 26B. TAMPILAN TABEL (TABLE VIEW) ================= */
          <>
            {/* 26. UI TABEL (Desktop view) */}
            <div className="mt-5 hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#292929] text-[11px] font-mono text-[#777777] uppercase tracking-wider bg-[#111111]/50">
                    <th className="py-3 px-4 w-12 text-center">NO</th>
                    <th className="py-3 px-4 min-w-[280px]">TEKS</th>
                    <th className="py-3 px-4 w-28 text-center">GAMBAR</th>
                    <th className="py-3 px-4 w-28">STATUS</th>
                    <th className="py-3 px-4 w-36">TERAKHIR UPDATE</th>
                    <th className="py-3 px-4 w-44 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {filteredTexts.map((item, index) => {
                    const isLongText = item.text.length > 90;
                    const truncatedText = isLongText ? item.text.slice(0, 90) + '...' : item.text;
                    const isActive = item.status === 'active';

                    return (
                      <tr key={item.id} className="hover:bg-[#111111] transition-colors group">
                        {/* NO */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-[#777777]">
                          {index + 1}
                        </td>

                        {/* 9. TEKS (Truncated + Lihat Selengkapnya) */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {item.title && (
                              <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs mb-1">
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-white font-medium">{item.title}</span>
                              </div>
                            )}
                            <p className="text-white text-xs leading-relaxed whitespace-pre-line break-words">
                              {truncatedText}
                            </p>
                            {isLongText && (
                              <button
                                onClick={() => setDetailText(item)}
                                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 hover:underline"
                              >
                                <span>Lihat Selengkapnya</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* GAMBAR */}
                        <td className="py-3.5 px-4 text-center">
                          {item.image_url ? (
                            <button
                              onClick={() => setImageModalUrl(item.image_url || null)}
                              className="relative group/img inline-block overflow-hidden rounded-lg border border-[#292929] hover:border-blue-500/50 transition-all"
                              title="Klik untuk memperbesar gambar"
                            >
                              <img
                                src={item.image_url}
                                alt="Konten"
                                className="w-12 h-12 object-cover transition-transform group-hover/img:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </button>
                          ) : (
                            <div className="inline-flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-[#151515] border border-[#222222] text-[#555555]">
                              <span className="text-base">🖼️</span>
                              <span className="text-[8px] font-mono mt-0.5">KOSONG</span>
                            </div>
                          )}
                        </td>

                        {/* 13. STATUS */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              isActive
                                ? 'bg-emerald-500/10 text-[#22C55E] border-emerald-500/30'
                                : 'bg-neutral-500/10 text-[#A0A0A0] border-neutral-500/30'
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

                        {/* TERAKHIR UPDATE */}
                        <td className="py-3.5 px-4 text-xs font-mono text-[#A0A0A0]">
                          {item.updated_at}
                        </td>

                        {/* 17. AKSI: 📋 SALIN, ✏️ EDIT, 🗑️ HAPUS */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* 8 & 17. SALIN TEKS (Wajib, only copies text) */}
                            <button
                              id={`btn-copy-text-${item.id}`}
                              onClick={() => handleCopySingle(item.title ? `${item.title}\n\n${item.text}` : item.text, item.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#151515] hover:bg-[#222222] text-white border border-[#292929] hover:border-blue-500/40 text-xs font-medium flex items-center gap-1 transition-all"
                              title="Salin isi teks ke clipboard"
                            >
                              <Copy className="w-3.5 h-3.5 text-blue-400" />
                              <span>Salin</span>
                            </button>

                            {/* 10. EDIT TEKS */}
                            {canEdit && (
                              <button
                                id={`btn-edit-text-${item.id}`}
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 transition-all"
                                title="Edit Teks"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            {/* 12. HAPUS TEKS */}
                            {canDelete && (
                              <button
                                id={`btn-delete-text-${item.id}`}
                                onClick={() => setDeletingText(item)}
                                className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
                                title="Hapus Teks"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 27. RESPONSIVE MOBILE: Card view touch-friendly */}
            <div className="mt-5 md:hidden space-y-4">
              {filteredTexts.map((item, index) => {
                const isActive = item.status === 'active';
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#111111] border border-[#292929] space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-blue-400">
                          TEKS #{String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-emerald-500/10 text-[#22C55E] border-emerald-500/30'
                            : 'bg-neutral-500/10 text-[#A0A0A0] border-neutral-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-[#22C55E]' : 'bg-[#A0A0A0]'
                          }`}
                        />
                        {isActive ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>

                    {/* Judul jika ada */}
                    {item.title && (
                      <div className="flex items-start gap-1.5 text-blue-400 font-bold text-xs">
                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="text-white font-semibold">{item.title}</span>
                      </div>
                    )}

                    <p className="text-xs text-white leading-relaxed whitespace-pre-line break-words">
                      {item.text.length > 150 ? item.text.slice(0, 150) + '...' : item.text}
                    </p>

                    {item.text.length > 150 && (
                      <button
                        onClick={() => setDetailText(item)}
                        className="text-[11px] text-blue-400 font-medium hover:underline block"
                      >
                        Lihat Selengkapnya
                      </button>
                    )}

                    {/* Image display */}
                    {item.image_url ? (
                      <div className="relative rounded-lg overflow-hidden border border-[#292929] max-h-48 bg-black">
                        <img
                          src={item.image_url}
                          alt="Lampiran Teks"
                          className="w-full h-36 object-cover"
                        />
                        <button
                          onClick={() => setImageModalUrl(item.image_url || null)}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white rounded text-[10px] flex items-center gap-1 backdrop-blur-sm"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Perbesar</span>
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 px-3 rounded-lg bg-[#151515] border border-[#222222] text-[11px] text-[#666666] flex items-center gap-2">
                        <span>🖼️</span>
                        <span>BELUM ADA GAMBAR</span>
                      </div>
                    )}

                    <div className="text-[10px] font-mono text-[#777777] flex items-center justify-between pt-1">
                      <span>Update: {item.updated_at}</span>
                      <span>Oleh: {item.created_by}</span>
                    </div>

                    {/* Action buttons on mobile */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#222222]">
                      <button
                        onClick={() => handleCopySingle(item.title ? `${item.title}\n\n${item.text}` : item.text)}
                        className="w-full py-2 px-2 rounded-lg bg-[#181818] hover:bg-[#252525] border border-[#333333] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                      >
                        <Copy className="w-3.5 h-3.5 text-blue-400" />
                        <span>📋 SALIN</span>
                      </button>

                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="w-full py-2 px-2 rounded-lg bg-[#181818] hover:bg-[#252525] border border-[#333333] text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>✏️ EDIT</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => setDeletingText(item)}
                          className="w-full py-2 px-2 rounded-lg bg-[#181818] hover:bg-rose-500/20 border border-[#333333] hover:border-rose-500/40 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>🗑️ HAPUS</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ================= 7. MODAL TAMBAH TEKS ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-[#292929] rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h4 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                  TAMBAH TEKS - {module.name_pk}
                </h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#A0A0A0] hover:text-white p-1 rounded-lg hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTextSubmit} className="mt-5 space-y-5">
              {/* Field JUDUL (Input Judul Teks) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider flex items-center gap-1.5">
                    JUDUL <span className="text-[11px] text-[#777777] font-normal normal-case">(Opsional)</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#777777]">
                    {newTextTitle.length} / 100 karakter
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Contoh: Jadwal Tayang, Promo Khusus, Info Resmi..."
                  value={newTextTitle}
                  onChange={(e) => setNewTextTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151515] border border-[#292929] text-white text-xs sm:text-sm placeholder-[#555555] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* Field TEKS * (Textarea besar with 0/5000 counter) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider">
                    TEKS <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${newTextContent.length > 5000 ? 'text-rose-400' : 'text-[#777777]'}`}>
                    {newTextContent.length} / 5000 karakter
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  maxLength={5000}
                  placeholder={`Contoh:\nSelamat datang di ${module.name_pk}!\nNikmati pengalaman terbaik bersama kami.`}
                  value={newTextContent}
                  onChange={(e) => setNewTextContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151515] border border-[#292929] text-white text-xs sm:text-sm placeholder-[#555555] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors leading-relaxed"
                />
              </div>

              {/* Field GAMBAR (Upload: JPG, JPEG, PNG, WEBP, max 2MB, preview) */}
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">
                  GAMBAR (OPSIONAL)
                </label>
                <input
                  ref={addFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageFile(file, (dataUrl) => setNewImageBase64(dataUrl));
                    }
                  }}
                />

                {newImageBase64 ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#292929] bg-black">
                    <img
                      src={newImageBase64}
                      alt="Preview Gambar"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewImageBase64('')}
                        className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                        title="Hapus gambar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => addFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#292929] hover:border-blue-500/50 rounded-xl p-4 text-center cursor-pointer bg-[#151515] hover:bg-[#181818] transition-all"
                  >
                    <Upload className="w-7 h-7 text-[#777777] mx-auto mb-2" />
                    <p className="text-xs text-white font-medium">Klik untuk upload gambar</p>
                    <p className="text-[10px] text-[#777777] mt-1">
                      JPG, JPEG, PNG, WEBP (Maksimal 2 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Field STATUS (● Aktif, ● Nonaktif) */}
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">
                  STATUS
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewTextStatus('active')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      newTextStatus === 'active'
                        ? 'bg-emerald-500/15 text-[#22C55E] border-emerald-500/40 shadow-sm'
                        : 'bg-[#151515] text-[#A0A0A0] border-[#292929] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    ● Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTextStatus('inactive')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      newTextStatus === 'inactive'
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-sm'
                        : 'bg-[#151515] text-[#A0A0A0] border-[#292929] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    ● Nonaktif
                  </button>
                </div>
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
                  SIMPAN TEKS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 10 & 11. MODAL EDIT TEKS ================= */}
      {editingText && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-[#292929] rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" />
                <h4 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                  EDIT TEKS
                </h4>
              </div>
              <button
                onClick={() => setEditingText(null)}
                className="text-[#A0A0A0] hover:text-white p-1 rounded-lg hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-5">
              {/* Field JUDUL */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider flex items-center gap-1.5">
                    JUDUL <span className="text-[11px] text-[#777777] font-normal normal-case">(Opsional)</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#777777]">
                    {editTextTitle.length} / 100 karakter
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Masukkan judul teks..."
                  value={editTextTitle}
                  onChange={(e) => setEditTextTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151515] border border-[#292929] text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Field TEKS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider">
                    TEKS <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${editTextContent.length > 5000 ? 'text-rose-400' : 'text-[#777777]'}`}>
                    {editTextContent.length} / 5000 karakter
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  maxLength={5000}
                  value={editTextContent}
                  onChange={(e) => setEditTextContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151515] border border-[#292929] text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
                />
              </div>

              {/* 11. UPDATE GAMBAR: GAMBAR SAAT INI + [🔄 GANTI GAMBAR] [🗑️ HAPUS GAMBAR] */}
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">
                  GAMBAR SAAT INI
                </label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageFile(file, (dataUrl) => {
                        setEditImageBase64(dataUrl);
                        setIsImageReplaced(true);
                        setIsImageRemoved(false);
                      });
                    }
                  }}
                />

                {!isImageRemoved && editImageBase64 ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-[#292929] bg-black">
                      <img
                        src={editImageBase64}
                        alt="Gambar Saat Ini"
                        className="w-full h-44 object-cover"
                      />
                      {isImageReplaced && (
                        <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
                          Gambar Baru Terpilih
                        </div>
                      )}
                    </div>
                    {canUpdateImg && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#292929] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                          <span>🔄 GANTI GAMBAR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsImageRemoved(true);
                            setIsImageReplaced(false);
                            setEditImageBase64('');
                          }}
                          className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>🗑️ HAPUS GAMBAR</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="py-4 px-3 rounded-xl bg-[#151515] border border-[#222222] text-center text-xs text-[#777777]">
                      Belum ada gambar yang dilampirkan untuk teks ini.
                    </div>
                    {canUpdateImg && (
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#292929] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        <span>UPLOAD GAMBAR</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Field STATUS */}
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">
                  STATUS
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditTextStatus('active')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      editTextStatus === 'active'
                        ? 'bg-emerald-500/15 text-[#22C55E] border-emerald-500/40 shadow-sm'
                        : 'bg-[#151515] text-[#A0A0A0] border-[#292929] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTextStatus('inactive')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      editTextStatus === 'inactive'
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
                  onClick={() => setEditingText(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#292929] bg-[#151515] hover:bg-[#1a1a1a] text-[#A0A0A0] hover:text-white text-xs font-semibold transition-colors"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  UPDATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 9. MODAL DETAIL TEKS (Lihat Selengkapnya) ================= */}
      {detailText && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-[#292929] rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h4 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                  DETAIL TEKS
                </h4>
              </div>
              <button
                onClick={() => setDetailText(null)}
                className="text-[#A0A0A0] hover:text-white p-1 rounded-lg hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Judul jika ada */}
              {detailText.title && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold block mb-1">
                    JUDUL TEKS
                  </span>
                  <h3 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                    {detailText.title}
                  </h3>
                </div>
              )}

              {/* Entire Text */}
              <div className="p-4 rounded-xl bg-[#151515] border border-[#292929] max-h-72 overflow-y-auto">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] font-semibold block mb-1.5">
                  ISI TEKS
                </span>
                <p className="text-white text-sm leading-relaxed whitespace-pre-line break-words select-text">
                  {detailText.text}
                </p>
              </div>

              {/* Image if available */}
              {detailText.image_url && (
                <div className="rounded-xl overflow-hidden border border-[#292929] bg-black">
                  <img
                    src={detailText.image_url}
                    alt="Lampiran"
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => setImageModalUrl(detailText.image_url || null)}
                  />
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#777777] px-1">
                <span>Status: {detailText.status === 'active' ? '🟢 Aktif' : '⚪ Nonaktif'}</span>
                <span>Update: {detailText.updated_at}</span>
              </div>

              {/* Action Buttons: 📋 SALIN TEKS, ✏️ EDIT, Tutup */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setDetailText(null)}
                  className="px-4 py-2 rounded-xl border border-[#292929] bg-[#151515] hover:bg-[#1a1a1a] text-[#A0A0A0] hover:text-white text-xs font-semibold transition-colors"
                >
                  Tutup
                </button>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = detailText;
                      setDetailText(null);
                      handleOpenEdit(item);
                    }}
                    className="px-4 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>✏️ EDIT</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCopySingle(detailText.title ? `${detailText.title}\n\n${detailText.text}` : detailText.text)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>📋 SALIN TEKS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 12. MODAL KONFIRMASI HAPUS TEKS ================= */}
      {deletingText && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#292929] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-[#292929]">
              <Trash2 className="w-6 h-6" />
              <h4 className="text-base font-bold text-white font-['Poppins',sans-serif]">
                Hapus Teks Ini?
              </h4>
            </div>

            <p className="text-sm text-[#A0A0A0] mt-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus data teks ini? Gambar terkait (jika ada) juga akan dihapus permanen.
            </p>

            <div className="mt-3 p-3 rounded-lg bg-[#151515] border border-[#222222] text-xs text-white line-clamp-3 italic">
              "{deletingText.text}"
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#292929]">
              <button
                onClick={() => setDeletingText(null)}
                className="px-4 py-2 rounded-xl border border-[#292929] bg-[#151515] hover:bg-[#1a1a1a] text-[#A0A0A0] hover:text-white text-xs font-semibold transition-colors"
              >
                BATAL
              </button>
              <button
                onClick={handleConfirmDeleteText}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all"
              >
                HAPUS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for image preview */}
      {imageModalUrl && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setImageModalUrl(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setImageModalUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={imageModalUrl}
              alt="Pratinjau Penuh"
              className="max-h-[85vh] max-w-full object-contain rounded-xl border border-[#333333]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
