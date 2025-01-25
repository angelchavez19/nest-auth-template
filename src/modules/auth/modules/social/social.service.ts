import axios from 'axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ConfigCommonService } from 'src/common/config.common';
import { PrismaCommonService } from 'src/common/prisma.common';
import {
  GithubUserEmailI,
  GithubUserI,
} from 'src/types/github-credentials.type';
import { AuthCommonService } from '../../common.service';
import { PrismaService } from 'src/providers/prisma/prisma';
import {
  GoogleUserCredentialsI,
  GoogleUserInfoI,
} from 'src/types/google-credentials.type';
import { LoggerCommonService } from 'src/common/logger.common';

@Injectable()
export class SocialService {
  constructor(
    private readonly authCommon: AuthCommonService,
    private readonly configCommon: ConfigCommonService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerCommonService,
    private readonly prismaCommon: PrismaCommonService,
  ) {}

  async githubLogin(
    res: Response,
    code: string,
    lang: string = this.configCommon.defaultLang,
  ) {
    try {
      const userCredentials = await this._getGithubUserInfo(code);

      const existingUser = await this.prismaCommon.getExistingUserByEmail(
        userCredentials.email,
      );

      if (existingUser && existingUser.provider !== 'GITHUB') {
        this.logger.logger.error(
          'Error: Existing user attempted to log in with a different provider.',
          {
            userId: existingUser.id,
            expectedProvider: 'GITHUB',
            currentProvider: existingUser.provider,
          },
        );
        res.redirect(
          `${this.configCommon.clientUrl}/${lang}/auth/login?error=provider_error&provider=${existingUser.provider}`,
        );
        res.status(409).send();
        return;
      } else if (existingUser && existingUser.provider === 'GITHUB') {
        this.logger.logger.info('Existing user logging in', {
          userId: existingUser.id,
          provider: 'GITHUB',
        });
        await this.authCommon.generateSessionTokens(existingUser, res, lang);
      } else {
        try {
          const user = await this.prisma.user.create({
            data: {
              firstName: userCredentials.name,
              email: userCredentials.email,
              profileImage: userCredentials.avatar_url,
              provider: 'GITHUB',
              isEmailVerified: true,
              role: {
                connect: {
                  name: this.configCommon.defaultUserRole,
                },
              },
            },
            select: this.prismaCommon.selectExistingUser,
          });
          this.logger.logger.info('New user created via GitHub', {
            userId: user.id,
            email: user.email,
          });
          await this.authCommon.generateSessionTokens(user, res, lang);
        } catch (err) {
          this.logger.logger.error('Error creating user via GitHub', {
            reason: err.message,
          });
          throw new HttpException('Something went wrong', HttpStatus.CONFLICT);
        }
      }

      res.redirect(`${this.configCommon.clientUrl}/${lang}/app`);
      res.send();
    } catch (err) {
      this.logger.logger.error('GitHub login failed', { reason: err.message });
      throw err;
    }
  }

  async _getGithubUserInfo(code: string) {
    const userCredentials = await this._getGithubToken(code);
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

      if (responseUser.data.email) {
        this.logger.logger.info('GitHub user info retrieved', {
          userId: responseUser.data.id,
          email: responseUser.data.email,
        });
        return responseUser.data;
      }
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
      this.logger.logger.error('Error fetching GitHub user info', {
        reason: err.message,
      });
      throw Error(err);
    }
  }

  async _getGithubToken(code: string) {
    const rootUrl = 'https://github.com/login/oauth/access_token';

    const options = {
      client_id: this.configCommon.githubOauthClientID,
      client_secret: this.configCommon.githubOauthClientSecret,
      code,
    };

    const queryString = new URLSearchParams(options);

    try {
      const response = await axios.post<string>(`${rootUrl}?${queryString}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = new URLSearchParams(response.data);

      if (data.get('error') && !data.get('access_token')) {
        this.logger.logger.error('GitHub token retrieval failed', {
          reason: data.get('error'),
        });
        throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED);
      }

      this.logger.logger.info('GitHub token retrieved successfully');
      return data;
    } catch (err) {
      this.logger.logger.error('Error retrieving GitHub token', {
        reason: err.message,
      });
      throw err;
    }
  }

  async googleLogin(
    res: Response,
    code: string,
    lang: string = this.configCommon.defaultLang,
  ) {
    try {
      const userInfo = await this._getGoogleUserInfo(code);

      const existingUser = await this.prismaCommon.getExistingUserByEmail(
        userInfo.email,
      );

      if (existingUser && existingUser.provider !== 'GOOGLE') {
        this.logger.logger.error(
          'Error: Existing user attempted to log in with a different provider.',
          {
            userId: existingUser.id,
            expectedProvider: 'GOOGLE',
            currentProvider: existingUser.provider,
          },
        );
        res.redirect(
          `${this.configCommon.clientUrl}/${lang}/auth/login?error=provider_error&provider=${existingUser.provider}`,
        );
        res.status(409).send();
        return;
      } else if (existingUser && existingUser.provider === 'GOOGLE') {
        this.logger.logger.info('Existing user logging in via Google', {
          userId: existingUser.id,
          provider: 'GOOGLE',
        });
        await this.authCommon.generateSessionTokens(existingUser, res, lang);
      } else {
        try {
          const user = await this.prisma.user.create({
            data: {
              firstName: userInfo.given_name,
              lastName: userInfo.family_name,
              email: userInfo.email,
              profileImage: userInfo.picture,
              provider: 'GOOGLE',
              isEmailVerified: true,
              role: {
                connect: {
                  name: this.configCommon.defaultUserRole,
                },
              },
            },
            select: this.prismaCommon.selectExistingUser,
          });
          this.logger.logger.info('New user created via Google', {
            userId: user.id,
            email: user.email,
          });
          await this.authCommon.generateSessionTokens(user, res, lang);
        } catch (err) {
          this.logger.logger.error('Error creating user via Google', {
            reason: err.message,
          });
          throw new HttpException('Something went wrong', HttpStatus.CONFLICT);
        }
      }

      res.redirect(`${this.configCommon.clientUrl}/${lang}/app`);
      res.send();
    } catch (err) {
      this.logger.logger.error('Google login failed', { reason: err.message });
      throw err;
    }
  }

  async _getGoogleUserInfo(code: string) {
    const token = await this._getGoogleToken(code);

    try {
      const response = await axios.get<GoogleUserInfoI>(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        },
      );

      this.logger.logger.info('Google user info retrieved', {
        email: response.data.email,
      });
      return response.data;
    } catch (err) {
      this.logger.logger.error('Error fetching Google user info', {
        reason: err.message,
      });
      throw new HttpException('Invalid user login', HttpStatus.BAD_REQUEST);
    }
  }

  async _getGoogleToken(code: string) {
    try {
      const response = await axios.post<GoogleUserCredentialsI>(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: this.configCommon.googleOauthClientID,
          client_secret: this.configCommon.googleOauthClientSecret,
          redirect_uri: 'postmessage',
          grant_type: 'authorization_code',
        },
      );

      this.logger.logger.info('Google token retrieved successfully');
      return response.data;
    } catch (err) {
      this.logger.logger.error('Error retrieving Google token', {
        reason: err.message,
      });
      throw new HttpException('Invalid user login', HttpStatus.BAD_REQUEST);
    }
  }
}
