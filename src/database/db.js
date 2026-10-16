// Database Service using standard IndexedDB API without external dependencies
const DB_NAME = 'OfflineWebAI_DB';
const DB_VERSION = 1;

export const STORES = {
  NOTES: 'notes',
  DOCUMENTS: 'documents',
  SAVED_KNOWLEDGE: 'saved_knowledge',
  SETTINGS: 'settings'
};

class DatabaseService {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  async getDB() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Notes Store
        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
          notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          notesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // Documents Store
        if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
          const docsStore = db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
          docsStore.createIndex('name', 'name', { unique: false });
          docsStore.createIndex('importedAt', 'importedAt', { unique: false });
        }

        // Saved Knowledge Store
        if (!db.objectStoreNames.contains(STORES.SAVED_KNOWLEDGE)) {
          const knowledgeStore = db.createObjectStore(STORES.SAVED_KNOWLEDGE, { keyPath: 'id' });
          knowledgeStore.createIndex('category', 'category', { unique: false });
          knowledgeStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Settings Store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });

    return this.initPromise;
  }

  // Generic CRUD
  async getAll(storeName) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getById(storeName, id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, item) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => {
          if (e.target.error && e.target.error.name === 'QuotaExceededError') {
            reject(new Error('Browser storage quota exceeded. Please export or delete older data.'));
          } else {
            reject(req.error);
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  async delete(storeName, id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // Settings specific helpers
  async getSetting(key, defaultValue = null) {
    const record = await this.getById(STORES.SETTINGS, key);
    return record ? record.value : defaultValue;
  }

  async setSetting(key, value) {
    return this.put(STORES.SETTINGS, { key, value, updatedAt: new Date().toISOString() });
  }

  // Storage Stats (estimate quota and usage)
  async getStorageStats() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentage: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
        };
      } catch (e) {
        console.warn('Storage estimate failed:', e);
      }
    }
    return { usage: 0, quota: 0, percentage: 0 };
  }

  // Full Database Export / Backup
  async exportAllData() {
    const [notes, documents, knowledge, settings] = await Promise.all([
      this.getAll(STORES.NOTES),
      this.getAll(STORES.DOCUMENTS),
      this.getAll(STORES.SAVED_KNOWLEDGE),
      this.getAll(STORES.SETTINGS)
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'OfflineWeb AI',
      data: {
        notes,
        documents,
        savedKnowledge: knowledge,
        settings
      }
    };
  }

  // Full Database Import / Restore
  async importAllData(backupJson) {
    if (!backupJson || !backupJson.data) {
      throw new Error('Invalid backup file format.');
    }
    const { notes = [], documents = [], savedKnowledge = [], settings = [] } = backupJson.data;

    const db = await this.getDB();
    const tx = db.transaction(
      [STORES.NOTES, STORES.DOCUMENTS, STORES.SAVED_KNOWLEDGE, STORES.SETTINGS],
      'readwrite'
    );

    const putItems = (storeName, items) => {
      const store = tx.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
    };

    putItems(STORES.NOTES, notes);
    putItems(STORES.DOCUMENTS, documents);
    putItems(STORES.SAVED_KNOWLEDGE, knowledgeItemsSafe(savedKnowledge));
    putItems(STORES.SETTINGS, settings);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
}

function knowledgeItemsSafe(items) {
  return items.map(item => ({
    ...item,
    id: item.id || `k_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  }));
}

export const dbService = new DatabaseService();
