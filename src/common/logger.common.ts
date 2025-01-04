import * as winston from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigCommonService } from './config.common';

@Injectable()
export class LoggerCommonService {
  logger: winston.Logger;

  constructor(private readonly configService: ConfigCommonService) {
    this.logger = winston.createLogger({
      transports: this._getTransports(this.configService.debug),
    });
  }

  _getTransports(debug: boolean) {
    const fileTransporter = new winston.transports.File({
      filename: 'logs/app.log',
      format: this._getFileFormat(),
    });

    if (!debug) return [fileTransporter];

    const consoleTransporter = new winston.transports.Console({
      format: this._getConsoleFormat(),
    });

    return [consoleTransporter, fileTransporter];
  }

  _getPrintFormat() {
    return winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} - ${level}: ${message} ${metaString}`;
    });
  }

  _getFileFormat() {
    return winston.format.combine(
      winston.format.timestamp(),
      this._getPrintFormat(),
    );
  }

  _getConsoleFormat() {
    return winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      this._getPrintFormat(),
    );
  }
}
