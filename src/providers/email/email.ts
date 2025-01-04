import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { LoggerCommonService } from 'src/common/logger.common';

interface SendMail {
  email: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService {
  constructor(private readonly logger: LoggerCommonService) {}

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
    try {
      this.logger.logger.info('Attempting to send email', {
        to: email,
        subject,
      });

      await this.transporter.sendMail({
        from: process.env.EMAIL_HOST_USER,
        to: email,
        subject: `${subject} <${process.env.EMAIL_HOST_USER}>`,
        text,
        html,
      });

      this.logger.logger.info('Email sent successfully', {
        to: email,
        subject,
      });
    } catch (error) {
      this.logger.logger.error('Error sending email', {
        reason: error.message,
        email,
        subject,
      });
      throw new Error(`Failed to send email to ${email}`);
    }
  }
}
