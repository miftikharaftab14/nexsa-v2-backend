import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger('NotificationService');
  private initialized = false;

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    if (this.initialized) return;
    try {
      const serviceAccountPath = path.resolve(__dirname, '../../config/serviceAccountKey.json');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(serviceAccountPath) as ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.initialized = true;
      this.logger.log('Firebase Admin initialized for push notifications');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error);
      throw new InternalServerErrorException('Failed to initialize Firebase Admin');
    }
  }

  /**
   * Send a push notification to one or more device tokens
   * @param tokens Array of FCM device tokens
   * @param title Notification title
   * @param body Notification body
   * @param data Optional additional data
   */
  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.initialized) this.initFirebase();
    if (!tokens || tokens.length === 0) return;
    try {
      await Promise.all(
        tokens.map(token =>
          admin.messaging().send({
            token,
            notification: { title, body },
            data,
          }),
        ),
      );
      this.logger.log(`Push notification sent to ${tokens.length} device(s)`);
    } catch (error) {
      this.logger.error('Failed to send push notification', error);
      throw new InternalServerErrorException('Failed to send push notification');
    }
  }
}
