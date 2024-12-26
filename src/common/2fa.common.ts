import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import { Injectable } from '@nestjs/common';
import { ConfigCommonService } from './config.common';

@Injectable()
export class TwoFactorAuthenticationManager {
  private algorithm = 'aes-256-cbc';
  private encriptionKey: Buffer;
  private initializationVector: Buffer;

  constructor(private readonly configCommon: ConfigCommonService) {
    this.encriptionKey = Buffer.from(this.configCommon.encriptionKey, 'base64');

    if (this.encriptionKey.length !== 32)
      throw new Error('Encryption key must be 32 bytes long');

    this.initializationVector = crypto.randomBytes(16);

    if (this.initializationVector.length !== 16)
      throw new Error('Initialization vector (IV) must be 16 bytes long');
  }

  encryptSecret(secret: string) {
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encriptionKey,
      this.initializationVector,
    );

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: this.initializationVector.toString('hex'),
    };
  }

  decryptSecret(encrypted: string, iv: string) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encriptionKey,
      Buffer.from(iv, 'hex'),
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  verifyTOTP(secret: string, code: string) {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
    });

    return verified;
  }

  makeTOTPsecret() {
    const secretTOTP = speakeasy.generateSecret({
      length: 20,
      name: this.configCommon.totpAppName,
    });

    const { encrypted, iv } = this.encryptSecret(secretTOTP.base32);
    return { secretTOTP, encrypted, iv };
  }
}
