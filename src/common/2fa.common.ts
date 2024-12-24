import * as crypto from 'crypto';

export class TwoFactorAuthenticationManager {
  private algorithm = 'aes-256-cbc';

  encryptSecret(secret: string, keyString: string, iv?: Buffer) {
    const key = Buffer.from(keyString, 'base64');

    if (key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes long');
    }

    const initializationVector = iv || crypto.randomBytes(16);

    if (initializationVector.length !== 16) {
      throw new Error('Initialization vector (IV) must be 16 bytes long');
    }

    const cipher = crypto.createCipheriv(
      this.algorithm,
      key,
      initializationVector,
    );

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: initializationVector.toString('hex'),
    };
  }

  decryptSecret(encrypted: string, keyString: string, iv: string) {
    const key = Buffer.from(keyString, 'base64');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex'),
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
