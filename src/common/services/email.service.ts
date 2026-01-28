import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { IEmailService } from '../interfaces/email-service.interface';
import { LogContexts } from '../enums/logging.enum';
import { BusinessException } from '../exceptions/business.exception';
import { getEmailConfig } from './email.config';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(LogContexts.EMAIL);
  private readonly transporter: Transporter | null = null;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    const cfg = getEmailConfig(this.configService);

    // In non-dev mode, fail fast if config is missing.
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv !== 'development') {
      const host = (cfg as any)?.host as string | undefined;
      const port = (cfg as any)?.port as number | undefined;
      const user = (cfg as any)?.auth?.user as string | undefined;
      const pass = (cfg as any)?.auth?.pass as string | undefined;

      if (!host || !port || !user || !pass) {
        this.logger.warn(
          'Email config is missing; email sending will be disabled.',
        );
        return;
      }
    }

    this.transporter = createTransport(cfg);
    this.initialized = true;

    // Don't log full config (it contains credentials)
    this.logger.log('Email transporter initialized');
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!this.initialized || !this.transporter) {
        throw new BusinessException(
          'Email service is not available. Email configuration is missing.',
          'EMAIL_SERVICE_NOT_AVAILABLE',
        );
      }

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException('Failed to send email', 'EMAIL_SEND_FAILED');
    }
  }

  async sendTemplatedEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ): Promise<void> {
    try {
      const html = this.compileTemplate(template, context);
      await this.sendEmail(to, subject, html);
    } catch (error) {
      this.logger.error(
        `Failed to send templated email to ${to}`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException('Failed to send templated email', 'EMAIL_SEND_FAILED');
    }
  }

  private compileTemplate(template: string, context: Record<string, string>): string {
    // Simple template compilation
    return template.replace(/\${(\w+)}/g, (_, key: string) => context[key] || '');
  }
}
