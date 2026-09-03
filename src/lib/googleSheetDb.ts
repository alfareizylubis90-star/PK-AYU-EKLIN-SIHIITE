import { PKModule, PKText, User, ActivityLog } from '../types';
import { DB, formatDateTime } from './storage';

export const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycby5mjJaqUzTHslp9oq7cH326a8tZQesYEg63Tz_vLLxwQePaufYzsrPpKExOCtWXkpE/exec';

const STORAGE_KEYS = {
  SHEET_URL: 'pk_shiite_sheet_url_v1',
  LAST_SYNC: 'pk_shiite_sheet_last_sync_v1',
  AUTO_SYNC: 'pk_shiite_sheet_auto_sync_v1',
};

export type SheetConnectionStatus = 'idle' | 'testing' | 'syncing' | 'connected' | 'needs_setup' | 'error';

export interface SheetTestResult {
  success: boolean;
  status: SheetConnectionStatus;
  message: string;
  latency?: number;
  rawResponse?: any;
}

export const GoogleSheetDB = {
  // Get active Google Sheet Web App URL
  getUrl(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
    return saved && saved.trim() ? saved.trim() : DEFAULT_SHEET_URL;
  },

  // Save new Google Sheet Web App URL
  setUrl(url: string): void {
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, url.trim());
    window.dispatchEvent(new Event('pk_sheet_config_updated'));
  },

  // Reset to original URL provided by user
  resetToDefaultUrl(): void {
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, DEFAULT_SHEET_URL);
    window.dispatchEvent(new Event('pk_sheet_config_updated'));
  },

  // Last sync timestamp
  getLastSync(): string {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 'Belum pernah sinkron';
  },

  setLastSync(timestamp: string = formatDateTime(new Date())): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
    window.dispatchEvent(new Event('pk_sheet_config_updated'));
  },

  // Auto sync preference
  isAutoSyncEnabled(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
    return val === null ? true : val === 'true';
  },

  setAutoSyncEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, String(enabled));
    window.dispatchEvent(new Event('pk_sheet_config_updated'));
  },

  // Test connection to Google Apps Script Web App
  async testConnection(customUrl?: string): Promise<SheetTestResult> {
    const url = (customUrl || this.getUrl()).trim();
    if (!url) {
      return {
        success: false,
        status: 'error',
        message: 'URL Google Apps Script Web App belum diisi.',
      };
    }

    const startTime = performance.now();
    try {
      // Calling with action=getAll which triggers the Apps Script
      const targetUrl = url.includes('?') ? `${url}&action=getAll` : `${url}?action=getAll`;
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
      });

      const latency = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return {
          success: false,
          status: 'error',
          latency,
          message: `Server merespon dengan status HTTP ${response.status} (${response.statusText}).`,
        };
      }

      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // Not JSON
        return {
          success: false,
          status: 'error',
          latency,
          message: 'Respon dari URL bukan JSON valid. Pastikan skrip mengembalikan ContentService.createTextOutput() bertipe JSON.',
          rawResponse: text.slice(0, 300),
        };
      }

      // Check specific error: placeholder spreadsheet ID
      if (data && data.error) {
        if (typeof data.error === 'string' && (
          data.error.includes('MASUKKAN_ID_SPREADSHEET_KAMU') ||
          data.error.toLowerCase().includes('illegal spreadsheet id') ||
          data.error.toLowerCase().includes('spreadsheet id')
        )) {
          return {
            success: false,
            status: 'needs_setup',
            latency,
            message: 'Endpoint terhubung! Namun di Google Apps Script Anda (Code.gs), ID Spreadsheet masih berisi "MASUKKAN_ID_SPREADSHEET_KAMU". Buka Apps Script dan masukkan ID Google Sheet Anda.',
            rawResponse: data,
          };
        }

        return {
          success: false,
          status: 'error',
          latency,
          message: `Google Apps Script mengembalikan pesan error: ${data.error}`,
          rawResponse: data,
        };
      }

      // If data returned successfully
      return {
        success: true,
        status: 'connected',
        latency,
        message: `Berhasil terhubung ke database Google Sheet! (${latency} ms)`,
        rawResponse: data,
      };
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      return {
        success: false,
        status: 'error',
        latency,
        message: `Gagal menghubungi URL Google Apps Script: ${err.message || 'Network Error / Terblokir'}.`,
      };
    }
  },

  // Pull data from Google Sheet into local DB
  async pullData(): Promise<{ success: boolean; message: string; count?: { modules: number; texts: number } }> {
    const test = await this.testConnection();
    if (!test.success) {
      return { success: false, message: test.message };
    }

    try {
      const data = test.rawResponse;
      if (!data) {
        return { success: false, message: 'Tidak ada data yang diterima dari Google Sheet.' };
      }

      let modulesCount = 0;
      let textsCount = 0;

      // Check if data contains modules
      if (Array.isArray(data.modules)) {
        for (const m of data.modules) {
          if (m && m.id && m.name_pk) {
            DB.saveModule({
              id: String(m.id),
              name_pk: String(m.name_pk),
              status: m.status === 'inactive' ? 'inactive' : 'active',
              created_at: m.created_at || formatDateTime(new Date()),
              updated_at: m.updated_at || formatDateTime(new Date()),
              created_by: m.created_by || 'ADMIN',
            });
            modulesCount++;
          }
        }
      }

      // Check if data contains texts
      if (Array.isArray(data.texts)) {
        for (const t of data.texts) {
          if (t && t.id && t.pk_id && t.text) {
            DB.saveText({
              id: String(t.id),
              pk_id: String(t.pk_id),
              title: t.title ? String(t.title) : undefined,
              text: String(t.text),
              image_url: t.image_url ? String(t.image_url) : undefined,
              image_id: t.image_id ? String(t.image_id) : undefined,
              status: t.status === 'inactive' ? 'inactive' : 'active',
              created_at: t.created_at || formatDateTime(new Date()),
              updated_at: t.updated_at || formatDateTime(new Date()),
              created_by: t.created_by || 'ADMIN',
            });
            textsCount++;
          }
        }
      }

      this.setLastSync();
      return {
        success: true,
        message: `Sinkronisasi berhasil! ${modulesCount} modul PK dan ${textsCount} konten teks diperbarui dari Google Sheet.`,
        count: { modules: modulesCount, texts: textsCount },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Terjadi kendala saat memproses data Google Sheet: ${err.message}`,
      };
    }
  },

  // Push local DB data to Google Sheet
  async pushData(): Promise<{ success: boolean; message: string }> {
    const url = this.getUrl();
    const modules = DB.getModules();
    const texts = DB.getTexts();
    const users = DB.getUsers();
    const logs = DB.getLogs();

    const payload = {
      action: 'syncAll',
      data: {
        modules,
        texts,
        users,
        logs,
      },
    };

    try {
      // Use text/plain to avoid CORS preflight issues with Google Apps Script
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let result: any = {};
      try {
        result = JSON.parse(text);
      } catch {
        result = { raw: text };
      }

      if (result.error) {
        return {
          success: false,
          message: `Google Apps Script mengembalikan error: ${result.error}`,
        };
      }

      this.setLastSync();
      return {
        success: true,
        message: `Berhasil mengunggah ${modules.length} modul PK dan ${texts.length} konten teks ke database Google Sheet.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal mengirim data ke Google Sheet: ${err.message}`,
      };
    }
  },

  // Ready-to-copy Google Apps Script Code template (Code.gs)
  getAppsScriptCode(): string {
    return `/**
 * ====================================================================
 * BACKEND GOOGLE APPS SCRIPT UNTUK DATABASE PK AYU EKLIN SIHIITE
 * ====================================================================
 * Panduan Penggunaan:
 * 1. Buat Spreadsheet baru di Google Sheets (https://sheets.new).
 * 2. Salin ID Spreadsheet dari URL (karakter panjang di antara /d/ dan /edit).
 * 3. Ganti "MASUKKAN_ID_SPREADSHEET_KAMU" di bawah dengan ID Spreadsheet Anda.
 * 4. Klik Deploy > New deployment > Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Salin URL Web App yang dihasilkan ke menu Pengaturan aplikasi.
 */

// GANTI NILAI DI BAWAH DENGAN ID SPREADSHEET GOOGLE SHEETS ANDA:
const SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_KAMU";

// Nama-nama Sheet di dalam Spreadsheet
const SHEET_NAMES = {
  MODULES: "PK_MODULES",
  TEXTS: "PK_TEXTS",
  USERS: "USERS",
  LOGS: "ACTIVITY_LOGS"
};

function getSpreadsheet() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === "MASUKKAN_ID_SPREADSHEET_KAMU") {
    throw new Error("Illegal spreadsheet id or key: MASUKKAN_ID_SPREADSHEET_KAMU");
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function initSheetsIfNeeded(ss) {
  // PK_MODULES
  let sheetModules = ss.getSheetByName(SHEET_NAMES.MODULES);
  if (!sheetModules) {
    sheetModules = ss.insertSheet(SHEET_NAMES.MODULES);
    sheetModules.appendRow(["id", "name_pk", "status", "created_at", "updated_at", "created_by"]);
    sheetModules.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  }

  // PK_TEXTS
  let sheetTexts = ss.getSheetByName(SHEET_NAMES.TEXTS);
  if (!sheetTexts) {
    sheetTexts = ss.insertSheet(SHEET_NAMES.TEXTS);
    sheetTexts.appendRow(["id", "pk_id", "title", "text", "image_url", "image_id", "status", "created_at", "updated_at", "created_by"]);
    sheetTexts.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  }

  // USERS
  let sheetUsers = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_NAMES.USERS);
    sheetUsers.appendRow(["id", "name", "email", "role", "status", "last_login"]);
    sheetUsers.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  }

  // ACTIVITY_LOGS
  let sheetLogs = ss.getSheetByName(SHEET_NAMES.LOGS);
  if (!sheetLogs) {
    sheetLogs = ss.insertSheet(SHEET_NAMES.LOGS);
    sheetLogs.appendRow(["id", "user_name", "user_role", "action", "target_pk", "details", "timestamp"]);
    sheetLogs.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  }
}

// GET Request handler
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : "getAll";
    const ss = getSpreadsheet();
    initSheetsIfNeeded(ss);

    if (action === "getAll" || action === "read") {
      const modules = readSheetData(ss.getSheetByName(SHEET_NAMES.MODULES));
      const texts = readSheetData(ss.getSheetByName(SHEET_NAMES.TEXTS));
      const users = readSheetData(ss.getSheetByName(SHEET_NAMES.USERS));
      const logs = readSheetData(ss.getSheetByName(SHEET_NAMES.LOGS));

      return jsonResponse({
        status: "success",
        modules: modules,
        texts: texts,
        users: users,
        logs: logs,
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({ error: "Action tidak valid" });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// POST Request handler
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || (e && e.parameter ? e.parameter.action : "");
    const ss = getSpreadsheet();
    initSheetsIfNeeded(ss);

    if (action === "syncAll" && payload.data) {
      // Overwrite / sync all sheets
      if (Array.isArray(payload.data.modules)) {
        writeSheetData(ss.getSheetByName(SHEET_NAMES.MODULES), ["id", "name_pk", "status", "created_at", "updated_at", "created_by"], payload.data.modules);
      }
      if (Array.isArray(payload.data.texts)) {
        writeSheetData(ss.getSheetByName(SHEET_NAMES.TEXTS), ["id", "pk_id", "title", "text", "image_url", "image_id", "status", "created_at", "updated_at", "created_by"], payload.data.texts);
      }
      if (Array.isArray(payload.data.users)) {
        writeSheetData(ss.getSheetByName(SHEET_NAMES.USERS), ["id", "name", "email", "role", "status", "last_login"], payload.data.users);
      }
      if (Array.isArray(payload.data.logs)) {
        writeSheetData(ss.getSheetByName(SHEET_NAMES.LOGS), ["id", "user_name", "user_role", "action", "target_pk", "details", "timestamp"], payload.data.logs);
      }

      return jsonResponse({
        status: "success",
        message: "Semua data berhasil disinkronisasi ke Google Sheet!",
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({ error: "Action tidak valid" });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function readSheetData(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0];
  const rows = values.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

function writeSheetData(sheet, headers, data) {
  if (!sheet) return;
  sheet.clear();
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");

  if (data && data.length > 0) {
    const rows = data.map(item => headers.map(h => item[h] !== undefined ? item[h] : ""));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
  }
};
