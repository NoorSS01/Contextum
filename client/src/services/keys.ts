import { openDB, IDBPDatabase } from 'idb';
import { deriveKey, encryptText, decryptText } from './crypto';
import { ProviderId } from '@shared/types';

interface EncryptedKeyRecord {
  providerId: ProviderId;
  cipher: string;
  iv: string;
  salt: string;
}

const DB_NAME = 'context-eng-db';
const STORE_NAME = 'api-keys';

/**
 * Initializes and returns a connection to the IndexedDB database.
 * Creates the object store if it doesn't exist.
 */
const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'providerId' });
      }
    },
  });
};

/**
 * Encrypts and securely stores an API key in IndexedDB.
 * @param providerId The AI provider (e.g., 'openai', 'anthropic').
 * @param plainKey The raw API key to store.
 * @param passphrase The user's master passphrase used for encryption.
 */
export const saveKey = async (providerId: ProviderId, plainKey: string, passphrase: string): Promise<void> => {
  const db = await initDB();
  const { key, salt } = await deriveKey(passphrase);
  const { cipher, iv } = await encryptText(plainKey, key);
  
  await db.put(STORE_NAME, {
    providerId,
    cipher,
    iv,
    salt
  });
};

/**
 * Retrieves and decrypts an API key from IndexedDB.
 * @param providerId The AI provider to retrieve the key for.
 * @param passphrase The user's master passphrase used for decryption.
 * @returns The decrypted API key, or null if it doesn't exist or decryption fails.
 */
export const loadKey = async (providerId: ProviderId, passphrase: string): Promise<string | null> => {
  const db = await initDB();
  const record: EncryptedKeyRecord | undefined = await db.get(STORE_NAME, providerId);
  
  if (!record) {
    return null;
  }

  try {
    const { key } = await deriveKey(passphrase, record.salt);
    return await decryptText(record.cipher, record.iv, key);
  } catch (err) {
    console.error(`Failed to decrypt key for ${providerId}. The passphrase might be incorrect.`, err);
    return null;
  }
};

/**
 * Deletes a stored API key from IndexedDB.
 * @param providerId The AI provider to remove the key for.
 */
export const deleteKey = async (providerId: ProviderId): Promise<void> => {
  const db = await initDB();
  await db.delete(STORE_NAME, providerId);
};

/**
 * Checks if an API key is stored for a specific provider (without decrypting it).
 * @param providerId The AI provider to check.
 * @returns True if a key exists, false otherwise.
 */
export const hasKeyStored = async (providerId: ProviderId): Promise<boolean> => {
  const db = await initDB();
  const record = await db.get(STORE_NAME, providerId);
  return !!record;
};
