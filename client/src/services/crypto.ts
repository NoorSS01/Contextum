export const deriveKey = async (passphrase: string, saltHex?: string): Promise<{ key: CryptoKey; salt: string }> => {
  const enc = new TextEncoder();
  
  // Either use provided salt (for decryption) or generate a new one (for encryption)
  const salt = saltHex 
    ? new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
    
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return {
    key,
    salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
};

export const encryptText = async (text: string, key: CryptoKey): Promise<{ cipher: string; iv: string }> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  return {
    cipher: btoa(String.fromCharCode(...new Uint8Array(encryptedBuf))),
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
};

export const decryptText = async (cipherBase64: string, ivHex: string, key: CryptoKey): Promise<string> => {
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const encryptedBytes = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));

  const decryptedBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBytes
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuf);
};
