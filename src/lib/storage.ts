import { DEFAULT_VILLAGE_PROFILE, Resident, VillageProfile } from '../types/population';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../types/settings';

const DB_NAME = 'buku_induk_desa_offline_db';
const DB_VERSION = 1;
const STORE_RESIDENTS = 'residents';
const STORE_SETTINGS = 'settings';
const PROFILE_KEY = 'village_profile';
const APP_SETTINGS_KEY = 'app_settings';

const LS_RESIDENTS_KEY = 'bidesa_offline_residents_v1';
const LS_PROFILE_KEY = 'bidesa_offline_profile_v1';
const LS_APP_SETTINGS_KEY = 'bidesa_offline_app_settings_v1';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB tidak tersedia'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_RESIDENTS)) {
        const store = db.createObjectStore(STORE_RESIDENTS, { keyPath: 'id' });
        store.createIndex('nik', 'nik', { unique: false });
        store.createIndex('noKk', 'noKk', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Gagal membuka database lokal'));
  });
}

export async function loadResidentsOffline(): Promise<Resident[]> {
  try {
    const db = await openDatabase();
    return await new Promise<Resident[]>((resolve, reject) => {
      const tx = db.transaction(STORE_RESIDENTS, 'readonly');
      const store = tx.objectStore(STORE_RESIDENTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = (req.result as Resident[]) ?? [];
        rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        resolve(rows);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    try {
      const raw = localStorage.getItem(LS_RESIDENTS_KEY);
      return raw ? (JSON.parse(raw) as Resident[]) : [];
    } catch {
      return [];
    }
  }
}

export async function saveAllResidentsOffline(residents: Resident[]): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RESIDENTS, 'readwrite');
      const store = tx.objectStore(STORE_RESIDENTS);
      store.clear();
      for (const item of residents) {
        store.put(item);
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Fallback to localStorage below
  }

  try {
    localStorage.setItem(LS_RESIDENTS_KEY, JSON.stringify(residents));
  } catch {
    // Ignore quota errors if IndexedDB already succeeded
  }
}

export async function loadVillageProfileOffline(): Promise<VillageProfile> {
  try {
    const db = await openDatabase();
    return await new Promise<VillageProfile>((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get(PROFILE_KEY);
      req.onsuccess = () => {
        const record = req.result as { key: string; value: VillageProfile } | undefined;
        resolve(record?.value ? { ...DEFAULT_VILLAGE_PROFILE, ...record.value } : DEFAULT_VILLAGE_PROFILE);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    try {
      const raw = localStorage.getItem(LS_PROFILE_KEY);
      return raw ? { ...DEFAULT_VILLAGE_PROFILE, ...JSON.parse(raw) } : DEFAULT_VILLAGE_PROFILE;
    } catch {
      return DEFAULT_VILLAGE_PROFILE;
    }
  }
}

export async function saveVillageProfileOffline(profile: VillageProfile): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      store.put({ key: PROFILE_KEY, value: profile });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Fallback to localStorage
  }

  try {
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

export async function loadAppSettingsOffline(): Promise<AppSettings> {
  try {
    const db = await openDatabase();
    return await new Promise<AppSettings>((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get(APP_SETTINGS_KEY);
      req.onsuccess = () => {
        const record = req.result as { key: string; value: AppSettings } | undefined;
        resolve(record?.value ? { ...DEFAULT_APP_SETTINGS, ...record.value } : DEFAULT_APP_SETTINGS);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    try {
      const raw = localStorage.getItem(LS_APP_SETTINGS_KEY);
      return raw ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) } : DEFAULT_APP_SETTINGS;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  }
}

export async function saveAppSettingsOffline(settings: AppSettings): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      store.put({ key: APP_SETTINGS_KEY, value: settings });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Fallback to localStorage
  }

  try {
    localStorage.setItem(LS_APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}
