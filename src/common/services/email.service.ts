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
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = createTransport(getEmailConfig(this.configService));
    this.logger.log('Email transporter initialized', getEmailConfig(this.configService));
    this.logger.log('test',configService.get<string>('NODE_ENV'));
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
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
      throw new BusinessException('Failed to send templated email', 'EMAIL_SEND_FAILED');
    }
  }

  private compileTemplate(template: string, context: Record<string, string>): string {
    // Simple template compilation
    return template.replace(/\${(\w+)}/g, (_, key: string) => context[key] || '');
  }
}
