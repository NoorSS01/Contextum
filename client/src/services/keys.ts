import { openDB } from 'idb';
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

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'providerId' });
      }
    },
  });
};

export const saveKey = async (providerId: ProviderId, plainKey: string, passphrase: string) => {
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

export const loadKey = async (providerId: ProviderId, passphrase: string): Promise<string | null> => {
  const db = await initDB();
  const record: EncryptedKeyRecord | undefined = await db.get(STORE_NAME, providerId);
  if (!record) return null;

  try {
    const { key } = await deriveKey(passphrase, record.salt);
    return await decryptText(record.cipher, record.iv, key);
  } catch (err) {
    console.error("Failed to decrypt key (possibly wrong passphrase)", err);
    return null;
  }
};

export const deleteKey = async (providerId: ProviderId) => {
  const db = await initDB();
  await db.delete(STORE_NAME, providerId);
};

export const hasKeyStored = async (providerId: ProviderId): Promise<boolean> => {
  const db = await initDB();
  const record = await db.get(STORE_NAME, providerId);
  return !!record;
};
