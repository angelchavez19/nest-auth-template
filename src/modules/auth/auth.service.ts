import * as speakeasy from 'speakeasy';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/providers/prisma/prisma';
import { EmailService } from 'src/providers/email/email';
import { CreateAccountDTO } from './dto/create-account.dto';
import { LoginDTO } from './dto/login.dto';
import { ConfirmChangePasswordDTO } from './dto/confirm-change-password.dto';
import { RequestTokenRefreshDTO } from './dto/request-refresh-token.dto';
import {
  confirmAccountTemplateEmailHTML,
  confirmAccountTemplateEmailText,
} from './template-email/create-account';
import { changePasswordTemplateEmailHTML } from './template-email/request-change-password';
import { SocialLoginDTO } from './dto/social-login.dto';
import axios from 'axios';
import {
  GoogleUserCredentialsI,
  GoogleUserInfoI,
} from 'src/types/google-credentials.type';
import { ExistingUserI } from './interfaces';
import {
  GithubUserEmailI,
  GithubUserI,
} from 'src/types/github-credentials.type';
import { TwoFactorAutenticationDTO } from './dto/two-factor-autentication.dto';
import { TwoFactorAuthenticationManager } from 'src/common/2fa.common';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private email: EmailService,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  clientURL = this.config.get<string>('CLIENT_URL');
  clientDomain = this.config.get<string>('CLIENT_DOMAIN');
  emailHostUser = this.config.get<string>('EMAIL_HOST_USER');
  googleClientID = this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID');
  googleClientSecret = this.config.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
  githubClientID = this.config.get<string>('GITHUB_OAUTH_CLIENT_ID');
  githubClientSecret = this.config.get<string>('GITHUB_OAUTH_CLIENT_SECRET');
  githubRedirectUrl = this.config.get<string>('GITHUB_OAUTH_REDIRECT_URL');
  encryptionKey = this.config.get<string>('ENCRYPTION_KEY');

  twoFactorManager = new TwoFactorAuthenticationManager();

  async createAccount(data: CreateAccountDTO) {
    const existingUser = await this._getExistingUserByEmail(data.email);

    if (existingUser)
      throw new HttpException('User already exists.', HttpStatus.CONFLICT);

    const token = this.jwt.sign({});
    const url = `${this.clientURL}/auth/confirm-email?token=${token}`;

    try {
      await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          token,
          password: this._getHashedPassword(data.password),
          roleId: data.roleId || 1,
        },
      });
    } catch {
      throw new HttpException('Something wrong', HttpStatus.CONFLICT);
    }

    await this.email.sendMail({
      email: data.email,
      subject: `Confirm Email <${this.emailHostUser}>`,
      text: confirmAccountTemplateEmailText(data, url),
      html: confirmAccountTemplateEmailHTML(data, url),
    });
  }

  async login(data: LoginDTO, response: Response) {
    const existingUser = await this._getExistingUserByEmail(data.email);

    if (!existingUser || !existingUser.isEmailVerified)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (!bcrypt.compareSync(data.password, existingUser.password))
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    await this._generateLoginTokens(existingUser, response);
    response.send();
  }

  async googleSocialLogin(data: SocialLoginDTO, response: Response) {
    const userData = await this._googleGetTokenAndUserInfo(data.code);

    const existingUser = await this._getExistingUserByEmail(
      userData.userInfo.email,
    );

    if (!existingUser) {
      try {
        const user = await this.prisma.user.create({
          data: {
            firstName: userData.userInfo.given_name,
            lastName: userData.userInfo.family_name,
            email: userData.userInfo.email,
            profileImage: userData.userInfo.picture,
            provider: 'GOOGLE',
            roleId: 1,
            isEmailVerified: true,
          },
          select: this.selectExistingUser,
        });

        await this._generateLoginTokens(user, response);
        response.send();
        return;
      } catch {
        throw new HttpException('Something wrong', HttpStatus.CONFLICT);
      }
    }

    await this._generateLoginTokens(existingUser, response);
    response.send();
  }

  async githubSocialLogin(code: string, response: Response) {
    const userCredentials = await this._githubGetUserInfo(code);

    const existingUser = await this._getExistingUserByEmail(
      userCredentials.email,
    );

    if (!existingUser) {
      try {
        const user = await this.prisma.user.create({
          data: {
            firstName: userCredentials.name,
            email: userCredentials.email,
            profileImage: userCredentials.avatar_url,
            provider: 'GITHUB',
            roleId: 1,
            isEmailVerified: true,
          },
          select: this.selectExistingUser,
        });
        await this._generateLoginTokens(user, response);
        response.send();
        return;
      } catch {
        throw new HttpException('Something wrong', HttpStatus.CONFLICT);
      }
    }

    await this._generateLoginTokens(existingUser, response);
    response.send();
  }

  async twoFactorAuthenticate(
    data: TwoFactorAutenticationDTO,
    request: Request,
    response: Response,
  ) {
    if (!request.cookies.user_id)
      throw new HttpException('Login is required.', HttpStatus.FORBIDDEN);

    const userID = Number(request.cookies.user_id);

    const user = await this.prisma.user.findUnique({
      select: this.selectExistingUser,
      where: { id: userID },
    });

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!user.twoFactorEnabled)
      throw new HttpException(
        'Two factor is not enabled',
        HttpStatus.FORBIDDEN,
      );

    const secret = this.twoFactorManager.decryptSecret(
      user.twoFactorSecret,
      this.encryptionKey,
      user.twoFactorIV,
    );

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: data.totpCode,
    });

    if (!verified)
      throw new HttpException(
        "User TOTP code isn't valid",
        HttpStatus.UNAUTHORIZED,
      );

    await this._generateLoginTokens(user, response, false);
    response.send();
  }

  async logout(response: Response) {
    response
      .cookie('access_token', '', {
        domain: this.clientDomain,
        expires: new Date(),
        httpOnly: true,
        sameSite: 'strict',
      })
      .cookie('refresh_token', '', {
        domain: this.clientDomain,
        expires: new Date(),
        httpOnly: true,
        sameSite: 'strict',
      })
      .cookie('user_id', '', {
        domain: this.clientDomain,
        expires: new Date(),
        httpOnly: true,
        sameSite: 'strict',
      })
      .send();
  }

  async refreshToken(request: Request, response: Response) {
    const _refreshToken = request.cookies.refresh_token;

    if (!_refreshToken)
      throw new HttpException('Invalid refresh token', HttpStatus.FORBIDDEN);

    const existingUser = await this.prisma.user.findUnique({
      where: { refreshToken: _refreshToken },
    });

    if (!existingUser)
      throw new HttpException('Invalid refresh token', HttpStatus.FORBIDDEN);

    const accessToken = this._getJWT({
      email: existingUser.email,
      roleId: existingUser.roleId,
    });

    const refreshToken = this._generateRefreshToken();
    const expirationToken = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * 3,
    );

    await this.prisma.user.update({
      data: { refreshToken, expirationToken },
      where: { email: existingUser.email },
    });

    response
      .cookie('access_token', accessToken, {
        domain: this.clientDomain,
        expires: new Date(new Date().getTime() + 1000 * 60 * 60),
        httpOnly: true,
        sameSite: 'strict',
      })
      .cookie('refresh_token', refreshToken, {
        domain: this.clientDomain,
        expires: expirationToken,
        httpOnly: true,
        sameSite: 'strict',
      })
      .send();
  }

  async confirmEmail(token: string) {
    if (!token)
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);

    const existingUser = await this._getExistingUserByToken(token);

    if (!existingUser || existingUser.isEmailVerified)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    try {
      await this.prisma.user.update({
        data: { token: null, isEmailVerified: true },
        where: { token },
      });
    } catch {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }
  }

  async requestRefreshAccountCreationToken(data: RequestTokenRefreshDTO) {
    const existingUser = await this._getExistingUserByEmail(data.email);

    if (!existingUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (existingUser.isEmailVerified)
      throw new HttpException('User account is confirmed', HttpStatus.CONFLICT);

    const token = this._getJWT();
    const url = `${this.clientURL}/auth/confirm-email?token=${token}`;

    await this.prisma.user.update({
      data: { token },
      where: { email: data.email },
    });

    await this.email.sendMail({
      email: data.email,
      subject: `Confirm Email <${this.emailHostUser}>`,
      text: confirmAccountTemplateEmailText(existingUser, url),
      html: confirmAccountTemplateEmailHTML(existingUser, url),
    });
  }

  async requestChangePassword(data: RequestTokenRefreshDTO) {
    const existingUser = await this._getExistingUserByEmail(data.email);

    if (!existingUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (!existingUser.isEmailVerified)
      throw new HttpException(
        'User account is not confirmed',
        HttpStatus.CONFLICT,
      );

    const token = this._getJWT();
    const url = `${this.clientURL}/auth/confirm-change-password?token=${token}`;

    await this.prisma.user.update({
      data: { token },
      where: { email: data.email },
    });

    await this.email.sendMail({
      email: existingUser.email,
      subject: `Password Reset Request <${this.emailHostUser}>`,
      text: changePasswordTemplateEmailHTML(existingUser.firstName, url),
      html: changePasswordTemplateEmailHTML(existingUser.firstName, url),
    });
  }

  async confirmChangePassword(data: ConfirmChangePasswordDTO, token: string) {
    if (!token)
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);

    try {
      this.jwt.verify(token);
    } catch {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this._getExistingUserByToken(token);

    if (!existingUser || !existingUser.isEmailVerified)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    await this.prisma.user.update({
      data: { token: null, password: this._getHashedPassword(data.password) },
      where: { token },
    });
  }

  _getHashedPassword(password: string) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  }

  _getJWT(payload: object = {}) {
    return this.jwt.sign(payload);
  }

  selectExistingUser = {
    id: true,
    email: true,
    isEmailVerified: true,
    password: true,
    firstName: true,
    lastName: true,
    roleId: true,
    role: {
      select: { name: true },
    },
    twoFactorSecret: true,
    twoFactorIV: true,
    twoFactorEnabled: true,
  };

  _getExistingUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      select: this.selectExistingUser,
      where: { email },
    });
  }

  _getExistingUserByToken(token: string) {
    return this.prisma.user.findUnique({ where: { token } });
  }

  _generateRefreshToken() {
    return randomBytes(32).toString('hex');
  }

  async _googleGetTokenAndUserInfo(code: string) {
    try {
      const response = await axios.post<GoogleUserCredentialsI>(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: this.googleClientID,
          client_secret: this.googleClientSecret,
          redirect_uri: 'postmessage',
          grant_type: 'authorization_code',
        },
      );

      const userResponse = await axios.get<GoogleUserInfoI>(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${response.data.access_token}`,
          },
        },
      );

      return { userCredentials: response.data, userInfo: userResponse.data };
    } catch {
      throw new HttpException('Invalid user login', HttpStatus.BAD_REQUEST);
    }
  }

  async _generateLoginTokens(
    user: ExistingUserI,
    response: Response,
    twoFA: boolean = true,
  ) {
    const accessToken = this._getJWT({
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
    });

    if (user.twoFactorEnabled && twoFA) {
      response.cookie('user_id', user.id, {
        domain: this.clientDomain,
        expires: new Date(new Date().getTime() + 1000 * 60 * 15),
        httpOnly: true,
        sameSite: 'strict',
      });
      throw new HttpException('2fa_required', HttpStatus.UNAUTHORIZED);
    }

    const refreshToken = this._generateRefreshToken();
    const expirationToken = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * 3,
    );

    await this.prisma.user.update({
      data: { refreshToken, expirationToken },
      where: { email: user.email },
    });

    response
      .cookie('access_token', accessToken, {
        domain: this.clientDomain,
        expires: new Date(new Date().getTime() + 1000 * 60 * 60),
        httpOnly: true,
        sameSite: 'strict',
      })
      .cookie('refresh_token', refreshToken, {
        domain: this.clientDomain,
        expires: expirationToken,
        httpOnly: true,
        sameSite: 'strict',
      });
  }

  async _githubGetToken(code: string) {
    const rootUrl = 'https://github.com/login/oauth/access_token';

    const options = {
      client_id: this.githubClientID,
      client_secret: this.githubClientSecret,
      code,
    };

    const queryString = new URLSearchParams(options);

    const response = await axios.post<string>(`${rootUrl}?${queryString}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = new URLSearchParams(response.data);

    if (data.get('error') && !data.get('access_token'))
      throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED);

    return data;
  }

  async _githubGetUserInfo(code: string) {
    const userCredentials = await this._githubGetToken(code);
    const userAccessToken = userCredentials.get('access_token');

    try {
      const responseUser = await axios.get<GithubUserI>(
        'https://api.github.com/user',
        {
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
          },
        },
      );

      if (responseUser.data.email) return responseUser.data;

      const responseUserEmail = await axios.get<GithubUserEmailI[]>(
        'https://api.github.com/user/emails',
        {
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
          },
        },
      );

      const userEmail = responseUserEmail.data.find((email) => email.primary);
      responseUser.data.email = userEmail.email;

      return responseUser.data;
    } catch (err: any) {
      throw Error(err);
    }
  }
}
