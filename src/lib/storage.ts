import { PKModule, PKText, User, ActivityLog } from '../types';

const STORAGE_KEYS = {
  MODULES: 'pk_shiite_modules_v2',
  TEXTS: 'pk_shiite_texts_v2',
  USERS: 'pk_shiite_users_v2',
  LOGS: 'pk_shiite_logs_v2',
  CURRENT_USER: 'pk_shiite_current_user_v2',
};

export function formatDateTime(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

export function formatDateOnly(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-01',
    name: 'ADMIN SHIITE',
    email: 'admin@pkshiite.com',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    permissions: {
      canAddText: true,
      canEditText: true,
      canUpdateImage: true,
    },
    status: 'active',
    last_login: '02 Sep 2026 18:20',
  },
  {
    id: 'usr-staff-01',
    name: 'Staff Konten PK',
    email: 'staff@pkshiite.com',
    role: 'STAFF',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    permissions: {
      canAddText: true,
      canEditText: true,
      canUpdateImage: true,
    },
    status: 'active',
    last_login: '02 Sep 2026 16:45',
  },
  {
    id: 'usr-user-01',
    name: 'Member Tamu',
    email: 'user@pkshiite.com',
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    permissions: {
      canAddText: false,
      canEditText: false,
      canUpdateImage: false,
    },
    status: 'active',
    last_login: '02 Sep 2026 17:10',
  },
];

const INITIAL_MODULES: PKModule[] = [
  {
    id: 'pk-001',
    name_pk: 'PK%20BOLA',
    status: 'active',
    created_at: '02 Sep 2026 08:15',
    updated_at: '02 Sep 2026 14:30',
    created_by: 'ADMIN',
  },
  {
    id: 'pk-002',
    name_pk: 'PK SPORT',
    status: 'active',
    created_at: '02 Sep 2026 09:20',
    updated_at: '02 Sep 2026 15:45',
    created_by: 'ADMIN',
  },
];

const INITIAL_TEXTS: PKText[] = [
  {
    id: 'txt-1001',
    pk_id: 'pk-001',
    title: 'Update Pasaran Sepakbola',
    text: 'Selamat datang di PK%20BOLA!\nNikmati pengalaman terbaik bersama kami dengan update pasaran lengkap dan akurat setiap saat.',
    image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    image_id: 'img-bola-01',
    status: 'active',
    created_at: '02 Sep 2026 08:26',
    updated_at: '02 Sep 2026 14:30',
    created_by: 'ADMIN',
  },
  {
    id: 'txt-1002',
    pk_id: 'pk-001',
    title: 'Jadwal Pertandingan Big Match',
    text: 'Jadwal pertandingan big match liga internasional malam ini telah dirilis. Harap pantau informasi skor langsung di sistem PK%20BOLA.',
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    image_id: 'img-bola-02',
    status: 'active',
    created_at: '02 Sep 2026 10:10',
    updated_at: '02 Sep 2026 13:15',
    created_by: 'ADMIN',
  },
  {
    id: 'txt-1003',
    pk_id: 'pk-001',
    title: 'Promo Turnover Mingguan',
    text: 'Promo bonus turnover mingguan khusus pengguna setia modul sepakbola. Hubungi layanan bantuan jika Anda memiliki kendala.',
    status: 'inactive',
    created_at: '02 Sep 2026 11:00',
    updated_at: '02 Sep 2026 11:00',
    created_by: 'ADMIN',
  },
  {
    id: 'txt-2001',
    pk_id: 'pk-002',
    title: 'Arena Olahraga Digital',
    text: 'Selamat datang di PK SPORT! Arena olahraga digital terlengkap dengan liputan basket, bulutangkis, tenis, dan esport terkini.',
    image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
    image_id: 'img-sport-01',
    status: 'active',
    created_at: '02 Sep 2026 09:30',
    updated_at: '02 Sep 2026 15:45',
    created_by: 'ADMIN',
  },
  {
    id: 'txt-2002',
    pk_id: 'pk-002',
    title: 'Turnamen Bulutangkis Terbuka',
    text: 'Turnamen bulutangkis terbuka super series dimulai hari ini. Cek klasemen dan statistik atlet favorit Anda.',
    status: 'active',
    created_at: '02 Sep 2026 12:00',
    updated_at: '02 Sep 2026 12:00',
    created_by: 'ADMIN',
  },
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-001',
    user_name: 'ADMIN',
    user_role: 'ADMIN',
    action: 'TAMBAH PK',
    target_pk: 'PK%20BOLA',
    details: 'Inisialisasi modul PK%20BOLA',
    timestamp: '02 Sep 2026 08:15',
  },
  {
    id: 'log-002',
    user_name: 'ADMIN',
    user_role: 'ADMIN',
    action: 'TAMBAH PK',
    target_pk: 'PK SPORT',
    details: 'Inisialisasi modul PK SPORT',
    timestamp: '02 Sep 2026 09:20',
  },
  {
    id: 'log-003',
    user_name: 'ADMIN',
    user_role: 'ADMIN',
    action: 'TAMBAH TEKS',
    target_pk: 'PK%20BOLA',
    details: 'Menambahkan teks sambutan utama dan gambar',
    timestamp: '02 Sep 2026 08:26',
  },
  {
    id: 'log-004',
    user_name: 'ADMIN',
    user_role: 'ADMIN',
    action: 'UPDATE GAMBAR',
    target_pk: 'PK%20BOLA',
    details: 'Memperbarui poster banner stadion bola',
    timestamp: '02 Sep 2026 08:27',
  },
  {
    id: 'log-005',
    user_name: 'ADMIN',
    user_role: 'ADMIN',
    action: 'EDIT TEKS',
    target_pk: 'PK%20BOLA',
    details: 'Revisi deskripsi pasaran bola',
    timestamp: '02 Sep 2026 14:30',
  },
];

export const DB = {
  // Modules
  getModules(): PKModule[] {
    const data = localStorage.getItem(STORAGE_KEYS.MODULES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(INITIAL_MODULES));
      return INITIAL_MODULES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MODULES;
    }
  },

  saveModule(module: PKModule): void {
    const list = this.getModules();
    const index = list.findIndex(m => m.id === module.id);
    if (index >= 0) {
      list[index] = module;
    } else {
      list.push(module);
    }
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(list));
    window.dispatchEvent(new Event('pk_database_updated'));
  },

  deleteModule(id: string): void {
    const list = this.getModules().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(list));
    
    // Also remove texts of this module
    const texts = this.getTexts().filter(t => t.pk_id !== id);
    localStorage.setItem(STORAGE_KEYS.TEXTS, JSON.stringify(texts));
    
    window.dispatchEvent(new Event('pk_database_updated'));
  },

  // Texts
  getTexts(pkId?: string): PKText[] {
    const data = localStorage.getItem(STORAGE_KEYS.TEXTS);
    let texts: PKText[] = [];
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TEXTS, JSON.stringify(INITIAL_TEXTS));
      texts = INITIAL_TEXTS;
    } else {
      try {
        texts = JSON.parse(data);
      } catch {
        texts = INITIAL_TEXTS;
      }
    }
    if (pkId) {
      return texts.filter(t => t.pk_id === pkId);
    }
    return texts;
  },

  saveText(textItem: PKText): void {
    const list = this.getTexts();
    const index = list.findIndex(t => t.id === textItem.id);
    if (index >= 0) {
      list[index] = textItem;
    } else {
      list.unshift(textItem);
    }
    localStorage.setItem(STORAGE_KEYS.TEXTS, JSON.stringify(list));
    window.dispatchEvent(new Event('pk_database_updated'));
  },

  deleteText(id: string): void {
    const list = this.getTexts().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TEXTS, JSON.stringify(list));
    window.dispatchEvent(new Event('pk_database_updated'));
  },

  // Users
  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUser(user: User): void {
    const list = this.getUsers();
    const index = list.findIndex(u => u.id === user.id);
    if (index >= 0) {
      list[index] = user;
    } else {
      list.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    window.dispatchEvent(new Event('pk_database_updated'));
  },

  deleteUser(id: string): void {
    const list = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    window.dispatchEvent(new Event('pk_database_updated'));
  },

  // Current User / Session
  getCurrentUser(): User {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        // fallback to admin
      }
    }
    const users = this.getUsers();
    const defaultUser = users[0] || INITIAL_USERS[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
    return defaultUser;
  },

  setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    window.dispatchEvent(new Event('pk_auth_updated'));
  },

  // Activity Logs
  getLogs(): ActivityLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_LOGS;
    }
  },

  addLog(user_name: string, user_role: User['role'], action: string, target_pk: string, details?: string): void {
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      user_name,
      user_role,
      action,
      target_pk,
      details,
      timestamp: formatDateTime(new Date()),
    };
    logs.unshift(newLog);
    // keep maximum 200 logs
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    window.dispatchEvent(new Event('pk_database_updated'));
  },

  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(INITIAL_MODULES));
    localStorage.setItem(STORAGE_KEYS.TEXTS, JSON.stringify(INITIAL_TEXTS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    window.dispatchEvent(new Event('pk_database_updated'));
    window.dispatchEvent(new Event('pk_auth_updated'));
  },
};

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard writeText failed, using fallback', e);
  }

  // Fallback
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed', err);
    return false;
  }
}
