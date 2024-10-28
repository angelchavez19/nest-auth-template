import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface SendMail {
  email: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
  });

  async sendMail({ email, subject, text, html }: SendMail) {
    await this.transporter.sendMail({
      from: process.env.EMAIL_HOST_USER,
      to: email,
      subject,
      text,
      html,
    });
  }
}
