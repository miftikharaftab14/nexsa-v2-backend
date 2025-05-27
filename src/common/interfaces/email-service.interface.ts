export interface IEmailService {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
  sendTemplatedEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ): Promise<void>;
}
