import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigCommonService {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL') || '';
  }

  get jwtSecretKey(): string {
    return this.configService.get<string>('JWT_SECRET_KEY') || '';
  }

  get encriptionKey(): string {
    return this.configService.get<string>('ENCRYPTION_KEY') || '';
  }

  get clientDomain(): string {
    return this.configService.get<string>('CLIENT_DOMAIN') || '';
  }

  get clientUrl(): string {
    return this.configService.get<string>('CLIENT_URL') || '';
  }

  get serverDomain(): string {
    return this.configService.get<string>('SERVER_DOMAIN') || '';
  }

  get serverUrl(): string {
    return this.configService.get<string>('SERVER_URL') || '';
  }

  get emailHost(): string {
    return this.configService.get<string>('EMAIL_HOST') || '';
  }

  get emailPort(): string {
    return this.configService.get<string>('EMAIL_PORT') || '';
  }

  get emailHostUser(): string {
    return this.configService.get<string>('EMAIL_HOST_USER') || '';
  }

  get emailHostPassword(): string {
    return this.configService.get<string>('EMAIL_HOST_PASSWORD') || '';
  }

  get googleOauthClientID(): string {
    return this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID') || '';
  }

  get googleOauthClientSecret(): string {
    return this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET') || '';
  }

  get githubOauthClientID(): string {
    return this.configService.get<string>('GITHUB_OAUTH_CLIENT_ID') || '';
  }

  get githubOauthClientSecret(): string {
    return this.configService.get<string>('GITHUB_OAUTH_CLIENT_SECRET') || '';
  }

  get githubOauthRedirectUrl(): string {
    return this.configService.get<string>('GITHUB_OAUTH_REDIRECT_URL') || '';
  }

  get totpAppName(): string {
    return (
      this.configService.get<string>('TOTP_APP_NAME') || 'Nest Auth Template'
    );
  }

  get debug(): boolean {
    return this.configService.get<boolean>('DEBUG') || false;
  }

  get defaultLang(): string {
    return this.configService.get<string>('DEFAULT_LANG') || 'en';
  }
}
