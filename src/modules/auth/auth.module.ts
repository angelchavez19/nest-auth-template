import { Module } from '@nestjs/common';
import { AccountModule } from './modules/account/account.module';
import { PasswordModule } from './modules/password/password.module';
import { SessionModule } from './modules/session/session.module';
import { SocialModule } from './modules/social/social.module';
import { TwofaModule } from './modules/twofa/twofa.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    AccountModule,
    PasswordModule,
    SessionModule,
    SocialModule,
    TwofaModule,
    UserModule,
  ],
})
export class AuthModule {}
