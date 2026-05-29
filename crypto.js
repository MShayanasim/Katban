// crypto.js - AES-GCM Web Crypto Wrapper for Katban Clipboard Security

// Converts base64 to Uint8Array
function base64ToBuffer(b64) {
  const binaryString = atob(b64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Converts Uint8Array to base64
function bufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Get or create the master AES key from chrome.storage.local
async function getOrCreateCryptoKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['katbanMasterKey'], async (data) => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
      
      let rawKeyData;
      if (data.katbanMasterKey) {
        // Load existing key
        const jwk = JSON.parse(data.katbanMasterKey);
        const key = await crypto.subtle.importKey(
          'jwk',
          jwk,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        resolve(key);
      } else {
        // Generate new key and save it
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        const jwk = await crypto.subtle.exportKey('jwk', key);
        chrome.storage.local.set({ katbanMasterKey: JSON.stringify(jwk) }, () => {
          resolve(key);
        });
      }
    });
  });
}

// Encrypt plain text into base64 format: b64(iv):b64(ciphertext)
async function katbanEncrypt(plainText) {
  try {
    const key = await getOrCreateCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encodedText = new TextEncoder().encode(plainText);
    
    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedText
    );
    
    const ivB64 = bufferToBase64(iv);
    const cipherB64 = bufferToBase64(ciphertextBuffer);
    
    return `${ivB64}:${cipherB64}`;
  } catch (err) {
    console.error("Encryption failed:", err);
    return null;
  }
}

// Decrypt base64 format into plain text
async function katbanDecrypt(encryptedString) {
  try {
    // If it's old unencrypted data (doesn't contain the colon separator), just return it
    if (!encryptedString.includes(':')) {
      return encryptedString;
    }
    
    const [ivB64, cipherB64] = encryptedString.split(':');
    const iv = new Uint8Array(base64ToBuffer(ivB64));
    const ciphertext = base64ToBuffer(cipherB64);
    
    const key = await getOrCreateCryptoKey();
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error("Decryption failed:", err);
    return "[Decryption Error]";
  }
}

// Expose to global scope for background.js and popup.js
globalThis.katbanEncrypt = katbanEncrypt;
globalThis.katbanDecrypt = katbanDecrypt;
