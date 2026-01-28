import { ConfigService } from '@nestjs/config';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export function getEmailConfig(configService: ConfigService): SMTPTransport.Options {
  const isDev = configService.get<string>('NODE_ENV') === 'development';
  return isDev
    ? {
        host: 'mailcatcher',
        port: 1025,
      }
    : {
        host: configService.get<string>('EMAIL_HOST'),
        port: Number(configService.get<string>('EMAIL_PORT')),
        secure: configService.get<string>('EMAIL_SECURE') === 'true',
        auth: {
          user: configService.get<string>('EMAIL_USER'),
          pass: configService.get<string>('EMAIL_PASS'),
        },
        tls: {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: configService.get<string>('EMAIL_TLS_REJECT_UNAUTHORIZED') === 'true',
        },
      };
}
