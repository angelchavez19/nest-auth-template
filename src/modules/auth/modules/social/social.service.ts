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

@Injectable()
export class SocialService {
  constructor(
    private readonly authCommon: AuthCommonService,
    private readonly configCommon: ConfigCommonService,
    private readonly prisma: PrismaService,
    private readonly prismaCommon: PrismaCommonService,
  ) {}

  async githubLogin(res: Response, code: string) {
    const userCredentials = await this._getGithubUserInfo(code);

    const existingUser = await this.prismaCommon.getExistingUserByEmail(
      userCredentials.email,
    );

    if (existingUser) {
      await this.authCommon.generateSessionTokens(existingUser, res);
    } else {
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
          select: this.prismaCommon.selectExistingUser,
        });
        await this.authCommon.generateSessionTokens(user, res);
      } catch {
        throw new HttpException('Something wrong', HttpStatus.CONFLICT);
      }
    }

    res.redirect(this.configCommon.clientUrl);
    res.send();
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

  async _getGithubToken(code: string) {
    const rootUrl = 'https://github.com/login/oauth/access_token';

    const options = {
      client_id: this.configCommon.githubOauthClientID,
      client_secret: this.configCommon.githubOauthClientSecret,
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

  async googleLogin(res: Response, code: string) {
    const userInfo = await this._getGoogleUserInfo(code);

    const existingUser = await this.prismaCommon.getExistingUserByEmail(
      userInfo.email,
    );

    if (existingUser) {
      await this.authCommon.generateSessionTokens(existingUser, res);
    } else {
      try {
        const user = await this.prisma.user.create({
          data: {
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
            email: userInfo.email,
            profileImage: userInfo.picture,
            provider: 'GOOGLE',
            roleId: 1,
            isEmailVerified: true,
          },
          select: this.prismaCommon.selectExistingUser,
        });

        await this.authCommon.generateSessionTokens(user, res);
      } catch {
        throw new HttpException('Something wrong', HttpStatus.CONFLICT);
      }
    }

    res.redirect(this.configCommon.clientUrl);
    res.send();
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

      return response.data;
    } catch {
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

      return response.data;
    } catch {
      throw new HttpException('Invalid user login', HttpStatus.BAD_REQUEST);
    }
  }
}
