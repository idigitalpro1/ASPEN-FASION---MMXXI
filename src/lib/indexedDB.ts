const DB_NAME = 'aspen_fashion_db';
const STORE_NAME = 'creations';
const DB_VERSION = 1;

export interface LocalCreation {
  id: string;
  type: 'image' | 'video' | 'magazine';
  dataUrl: string;
  prompt: string | null;
  createdAt: string;
  userId: string;
}

export function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function addCreationToDB(item: LocalCreation): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item); // Use 'put' to overwrite if ID exists, or create new
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB write failed, falling back to basic logger:", error);
  }
}

export async function getCreationsFromDB(): Promise<LocalCreation[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("IndexedDB read failed, returning empty list:", error);
    return [];
  }
}
