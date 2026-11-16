/**
 * db.js - IndexedDB storage manager for Local Custom Loy Krathong Web App
 * Supports storing custom backgrounds, custom krathong bases, custom stickers/decorations,
 * floated krathongs list, and user settings + full JSON backup/restore.
 */

const DB_NAME = 'LoyKrathongDB';
const DB_VERSION = 1;

class LoyKrathongDatabase {
  constructor() {
    this.db = null;
    this.readyPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store for floated krathongs
        if (!db.objectStoreNames.contains('krathongs')) {
          const krathongStore = db.createObjectStore('krathongs', { keyPath: 'id' });
          krathongStore.createIndex('timestamp', 'timestamp', { unique: false });
          krathongStore.createIndex('name', 'name', { unique: false });
        }

        // Store for user-uploaded custom bases
        if (!db.objectStoreNames.contains('custom_bases')) {
          const baseStore = db.createObjectStore('custom_bases', { keyPath: 'id' });
          baseStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store for user-uploaded custom decorations / stickers
        if (!db.objectStoreNames.contains('custom_decorations')) {
          const decoStore = db.createObjectStore('custom_decorations', { keyPath: 'id' });
          decoStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store for user-uploaded custom backgrounds
        if (!db.objectStoreNames.contains('custom_backgrounds')) {
          const bgStore = db.createObjectStore('custom_backgrounds', { keyPath: 'id' });
          bgStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store for settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async ready() {
    return this.readyPromise;
  }

  // Generic transaction helper
  async performTransaction(storeName, mode, callback) {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      let result;

      transaction.oncomplete = () => resolve(result);
      transaction.onerror = (e) => reject(e.target.error);

      try {
        result = callback(store);
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- KRATHONGS CRUD ---

  async saveKrathong(krathong) {
    if (!krathong.id) {
      krathong.id = 'krathong_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }
    if (!krathong.timestamp) {
      krathong.timestamp = Date.now();
    }
    await this.performTransaction('krathongs', 'readwrite', (store) => {
      store.put(krathong);
    });
    return krathong;
  }

  async getAllKrathongs() {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['krathongs'], 'readonly');
      const store = transaction.objectStore('krathongs');
      const request = store.index('timestamp').openCursor(null, 'prev'); // newest first
      const list = [];

      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          list.push(cursor.value);
          cursor.continue();
        } else {
          resolve(list);
        }
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getKrathongById(id) {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['krathongs'], 'readonly');
      const store = transaction.objectStore('krathongs');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteKrathong(id) {
    await this.performTransaction('krathongs', 'readwrite', (store) => {
      store.delete(id);
    });
    return true;
  }

  // --- CUSTOM BASES CRUD ---

  async saveCustomBase(baseObj) {
    if (!baseObj.id) {
      baseObj.id = 'base_' + Date.now();
    }
    if (!baseObj.createdAt) {
      baseObj.createdAt = Date.now();
    }
    await this.performTransaction('custom_bases', 'readwrite', (store) => {
      store.put(baseObj);
    });
    return baseObj;
  }

  async getCustomBases() {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['custom_bases'], 'readonly');
      const store = transaction.objectStore('custom_bases');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteCustomBase(id) {
    await this.performTransaction('custom_bases', 'readwrite', (store) => {
      store.delete(id);
    });
    return true;
  }

  // --- CUSTOM DECORATIONS CRUD ---

  async saveCustomDecoration(itemObj) {
    if (!itemObj.id) {
      itemObj.id = 'deco_' + Date.now();
    }
    if (!itemObj.createdAt) {
      itemObj.createdAt = Date.now();
    }
    await this.performTransaction('custom_decorations', 'readwrite', (store) => {
      store.put(itemObj);
    });
    return itemObj;
  }

  async getCustomDecorations() {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['custom_decorations'], 'readonly');
      const store = transaction.objectStore('custom_decorations');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteCustomDecoration(id) {
    await this.performTransaction('custom_decorations', 'readwrite', (store) => {
      store.delete(id);
    });
    return true;
  }

  // --- CUSTOM BACKGROUNDS CRUD ---

  async saveCustomBackground(bgObj) {
    if (!bgObj.id) {
      bgObj.id = 'bg_' + Date.now();
    }
    if (!bgObj.createdAt) {
      bgObj.createdAt = Date.now();
    }
    await this.performTransaction('custom_backgrounds', 'readwrite', (store) => {
      store.put(bgObj);
    });
    return bgObj;
  }

  async getCustomBackgrounds() {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['custom_backgrounds'], 'readonly');
      const store = transaction.objectStore('custom_backgrounds');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteCustomBackground(id) {
    await this.performTransaction('custom_backgrounds', 'readwrite', (store) => {
      store.delete(id);
    });
    return true;
  }

  // --- SETTINGS CRUD ---

  async setSetting(key, value) {
    await this.performTransaction('settings', 'readwrite', (store) => {
      store.put({ key, value });
    });
  }

  async getSetting(key, defaultValue = null) {
    await this.ready();
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result && request.result.value !== undefined) {
          resolve(request.result.value);
        } else {
          resolve(defaultValue);
        }
      };
      request.onerror = () => resolve(defaultValue);
    });
  }

  // --- BACKUP & RESTORE ---

  async exportAllData() {
    await this.ready();
    const krathongs = await this.getAllKrathongs();
    const customBases = await this.getCustomBases();
    const customDecorations = await this.getCustomDecorations();
    const customBackgrounds = await this.getCustomBackgrounds();

    const settingsKeys = ['waterlineHeight', 'reflectionOpacity', 'activeBackgroundId', 'soundEnabled'];
    const settings = {};
    for (const k of settingsKeys) {
      settings[k] = await this.getSetting(k, null);
    }

    return {
      version: 1,
      appName: 'LoyKrathongCustomApp',
      exportedAt: new Date().toISOString(),
      data: {
        krathongs,
        customBases,
        customDecorations,
        customBackgrounds,
        settings
      }
    };
  }

  async importAllData(importedJson) {
    await this.ready();
    let dataObj;
    if (typeof importedJson === 'string') {
      try {
        dataObj = JSON.parse(importedJson);
      } catch (e) {
        throw new Error('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
      }
    } else {
      dataObj = importedJson;
    }

    if (!dataObj.data) {
      throw new Error('ไฟล์สำรองข้อมูลไม่มีข้อมูลที่ถูกต้อง');
    }

    const { krathongs, customBases, customDecorations, customBackgrounds, settings } = dataObj.data;

    // Batch insert krathongs
    if (Array.isArray(krathongs)) {
      for (const k of krathongs) {
        if (k && k.id) await this.saveKrathong(k);
      }
    }

    // Batch insert bases
    if (Array.isArray(customBases)) {
      for (const b of customBases) {
        if (b && b.id) await this.saveCustomBase(b);
      }
    }

    // Batch insert decorations
    if (Array.isArray(customDecorations)) {
      for (const d of customDecorations) {
        if (d && d.id) await this.saveCustomDecoration(d);
      }
    }

    // Batch insert backgrounds
    if (Array.isArray(customBackgrounds)) {
      for (const bg of customBackgrounds) {
        if (bg && bg.id) await this.saveCustomBackground(bg);
      }
    }

    // Settings
    if (settings && typeof settings === 'object') {
      for (const [k, v] of Object.entries(settings)) {
        if (v !== null) await this.setSetting(k, v);
      }
    }

    return true;
  }

  async clearAllData() {
    await this.ready();
    const stores = ['krathongs', 'custom_bases', 'custom_decorations', 'custom_backgrounds', 'settings'];
    const transaction = this.db.transaction(stores, 'readwrite');
    for (const s of stores) {
      transaction.objectStore(s).clear();
    }
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = (e) => reject(e.target.error);
    });
  }
}

// Global instance
window.LoyDB = new LoyKrathongDatabase();
