import crypto from 'crypto';

/**
 * Server-Side Authenticated Encryption (AES-256-GCM)
 * Encrypts integration tokens and sensitive credentials before database persistence.
 * Zero plaintext secrets in database columns.
 */
export class TokenCipher {
  private key: Buffer;

  constructor(secretKey?: string) {
    const rawKey = secretKey || process.env.ENCRYPTION_SECRET || process.env.SUPABASE_JWT_SECRET || 'ephemeral_fallback_key_32_bytes_long_min!';
    this.key = crypto.createHash('sha256').update(rawKey).digest();
  }

  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    if (!ciphertext) return '';
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format: Expected iv:authTag:encrypted');
    }

    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

export const tokenCipher = new TokenCipher();

