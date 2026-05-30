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
let cachedCryptoKey = null;

async function getOrCreateCryptoKey() {
  if (cachedCryptoKey) return cachedCryptoKey;

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['katbanMasterKey'], async (data) => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
      
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
        cachedCryptoKey = key;
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
          cachedCryptoKey = key;
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
    // Validate the encrypted string format before attempting decryption.
    // The expected format is always "b64(iv):b64(ciphertext)".
    //
    // Old code returned the raw input as-is when no ':' was found, under the
    // assumption it was "old unencrypted data". This is dangerous because:
    //   (a) many real strings lack colons (numbers, words, etc.)
    //   (b) it silently bypasses decryption if an entry is ever stored incorrectly
    //
    // The only sentinel we recognise without decryption is '[Sensitive Data Protected]',
    // which is explicitly set by the copy handler and never encrypted.
    if (encryptedString === '[Sensitive Data Protected]') {
      return encryptedString;
    }
    if (!encryptedString.includes(':')) {
      // The string is in an unrecognised format. Return a safe display value
      // instead of silently returning potentially sensitive plaintext.
      return '[Legacy Data - Unable to Decrypt]';
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

// Expose to global scope explicitly for compatibility
if (typeof self !== 'undefined') {
  self.katbanEncrypt = katbanEncrypt;
  self.katbanDecrypt = katbanDecrypt;
}
