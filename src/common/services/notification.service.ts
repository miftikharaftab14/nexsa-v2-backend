import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger('NotificationService');
  private initialized = false;

  constructor(private configService: ConfigService) {
    this.initFirebase();
  }

  /**
   * Initializes Firebase Admin SDK.
   * Gracefully handles missing configuration - app can start without Firebase.
   */
  private initFirebase(): void {
    if (this.initialized) return;
    
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn(
          'Firebase configuration missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Push notifications will be disabled.',
        );
        return;
      }

      const serviceAccount: ServiceAccount = {
        projectId,
        clientEmail,
        privateKey,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      this.initialized = true;
      this.logger.log('Firebase Admin initialized for push notifications');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error);
      this.logger.warn('Push notifications will be disabled due to Firebase initialization failure');
      // Don't throw - allow app to start without Firebase
    }
  }

  /**
   * Send a push notification to one or more device tokens
   * @param tokens Array of FCM device tokens
   * @param title Notification title
   * @param body Notification body
   * @param data Optional additional data
   */
  /**
   * Send a push notification to one or more device tokens
   * @param tokens Array of FCM device tokens
   * @param title Notification title
   * @param body Notification body
   * @param data Optional additional data
   * @throws InternalServerErrorException if notification sending fails
   */
  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.initialized) {
      this.initFirebase();
      if (!this.initialized) {
        this.logger.warn('Cannot send push notification: Firebase not initialized');
        return;
      }
    }
    
    if (!tokens || tokens.length === 0) {
      this.logger.warn('No device tokens provided for push notification');
      return;
    }
    
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
