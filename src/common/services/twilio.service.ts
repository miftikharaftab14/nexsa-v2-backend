import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Twilio } from 'twilio';
import { IOtpService, OtpServiceResponse } from '../interfaces/otp-service.interface';
import { OtpVerification } from '../entities/otp-verification.entity';
import {
  OtpPurpose,
  OtpStatus,
  OTP_EXPIRY_MINUTES,
  MAX_FAILED_ATTEMPTS,
  MAX_RESEND_ATTEMPTS,
  RESEND_COOLDOWN_MINUTES,
} from '../enums/otp.enum';
import { addMinutes, isBefore, differenceInMinutes } from 'date-fns';
import { LogMessages } from '../enums/logging.enum';
import { BusinessException } from '../exceptions/business.exception';
import { IMessagingService } from '../interfaces/messaging-service.interface';

@Injectable()
export class TwilioService implements IOtpService, IMessagingService {
  private readonly client: Twilio | null = null;
  private serviceId: string | undefined = undefined;
  private readonly fromNumber: string | undefined = undefined;
  private readonly logger = new Logger(TwilioService.name);

  private initialized = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(OtpVerification)
    private readonly otpRepository: Repository<OtpVerification>,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const serviceId = this.configService.get<string>('TWILIO_SERVICE_ID');
    
    if (!serviceId) {
      this.logger.warn('TWILIO_SERVICE_ID is missing in environment variables. Twilio OTP service will be disabled.');
      return;
    }
    
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !this.fromNumber) {
      this.logger.warn('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER is missing. Twilio OTP service will be disabled.');
      return;
    }

    try {
      this.serviceId = serviceId;
      this.client = new Twilio(accountSid, authToken);
      this.initialized = true;
      this.logger.log(LogMessages.TWILIO_SERVICE_INITIALIZED);
    } catch (error) {
      this.logger.error('Failed to initialize Twilio Service', error);
      this.logger.warn('Twilio OTP service will be disabled.');
    }
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async invalidateExistingOtps(phoneNumber: string, purpose: OtpPurpose): Promise<void> {
    await this.otpRepository.update(
      {
        phone_number: phoneNumber,
        purpose,
        status: OtpStatus.PENDING,
      },
      {
        status: OtpStatus.EXPIRED,
      },
    );
  }

  private async checkResendEligibility(phoneNumber: string, purpose: OtpPurpose): Promise<void> {
    const lastOtp = await this.otpRepository.findOne({
      where: {
        phone_number: phoneNumber,
        purpose,
        status: OtpStatus.PENDING,
      },
      order: { created_at: 'DESC' },
    });

    if (lastOtp) {
      if (lastOtp.resend_count >= MAX_RESEND_ATTEMPTS) {
        throw new BusinessException(
          LogMessages.MAX_RESEND_ATTEMPTS_REACHED,
          'MAX_RESEND_ATTEMPTS_REACHED',
        );
      }

      const minutesSinceLastSent = differenceInMinutes(new Date(), lastOtp.last_sent_at);
      if (minutesSinceLastSent < RESEND_COOLDOWN_MINUTES) {
        throw new BusinessException(
          `Please wait ${RESEND_COOLDOWN_MINUTES} minutes before requesting a new OTP.`,
          'RESEND_COOLDOWN_MINUTES',
        );
      }
    }
  }

  async sendOtp(
    phoneNumber: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
  ): Promise<OtpServiceResponse> {
    try {
      this.logger.debug(`Attempting to send OTP to phone: ${phoneNumber}`);

      // Check resend eligibility
      await this.checkResendEligibility(phoneNumber, purpose);

      this.logger.debug(`Attempting to send OTP to phone: invalidateExistingOtps ${phoneNumber}`);
      // Invalidate existing OTPs
      await this.invalidateExistingOtps(phoneNumber, purpose);

      this.logger.debug(`Attempting to send OTP to phone: generateOtp ${phoneNumber}`);
      // Generate new OTP
      const otp = this.generateOtp();
      const expiresAt = addMinutes(new Date(), OTP_EXPIRY_MINUTES);

      // Create new OTP record
      const otpRecord = this.otpRepository.create({
        phone_number: phoneNumber,
        otp_code: otp,
        purpose,
        status: OtpStatus.PENDING,
        expires_at: expiresAt,
        last_sent_at: new Date(),
        resend_count: 1,
      });

      await this.otpRepository.save(otpRecord);

      // Send SMS
      if (!this.initialized || !this.client || !this.fromNumber) {
        this.logger.warn('Twilio Service is not initialized. OTP was saved but SMS was not sent.');
        return {
          success: true,
          message: `OTP generated for ${phoneNumber} (SMS service unavailable)`,
          otp,
        };
      }

      await this.client.messages.create({
        body: `Your Nexsa verification code is: ${otp}`,
        from: this.fromNumber,
        to: phoneNumber,
      });
      // await this.client.verify.v2
      //   .services(this.serviceId)
      //   .verifications.create({ to: phoneNumber, channel: 'sms' });

      this.logger.log(`OTP sent successfully to phone: ${phoneNumber}`);
      return {
        success: true,
        message: `OTP sent to ${phoneNumber}`,
        otp, // Return the OTP for verification
      };
    } catch (error) {
      this.logger.error(
        `Failed to send OTP to phone: ${phoneNumber}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BusinessException(
        error instanceof Error ? error.message : 'Unknown error',
        'TWILIO_SEND_OTP_FAILED',
      );
    }
  }

  async verifyOtp(
    phoneNumber: string,
    code: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
  ): Promise<boolean> {
    try {
      this.logger.debug(`Attempting to verify OTP for phone: ${phoneNumber}`);
      // to get the details of previousl sent otp
      const otpRecord = await this.otpRepository.findOne({
        where: {
          phone_number: phoneNumber,
          purpose,
          status: OtpStatus.PENDING,
        },
        order: { created_at: 'DESC' },
      });

      if (!otpRecord) {
        throw new BusinessException(LogMessages.NO_ACTIVE_OTP, 'NO_ACTIVE_OTP');
      }

      if (otpRecord.locked) {
        throw new BusinessException(LogMessages.TOO_MANY_ATTEMPTS, 'TOO_MANY_ATTEMPTS');
      }
      //if the expire time is occured an error will be generated
      if (isBefore(otpRecord.expires_at, new Date())) {
        await this.otpRepository.update(otpRecord.id, { status: OtpStatus.EXPIRED });
        throw new BusinessException(LogMessages.EXPIRED_OTP_TRY_AGAIN, 'EXPIRED_OTP_TRY_AGAIN');
      }
      //checking the failed otp attempts with wrong otp
      if (otpRecord.otp_code !== code) {
        const failedAttempts = otpRecord.failed_attempts + 1;
        const updates: Partial<OtpVerification> = { failed_attempts: failedAttempts };

        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          updates.locked = true;
          updates.lock_time = new Date();
          updates.status = OtpStatus.BLOCKED;
        }

        await this.otpRepository.update(otpRecord.id, updates);

        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          throw new BusinessException(LogMessages.TOO_MANY_ATTEMPTS, 'TOO_MANY_ATTEMPTS');
        }

        throw new BusinessException(LogMessages.INVALID_OTP, 'INVALID_OTP');
      }

      // OTP is valid
      await this.otpRepository.update(otpRecord.id, {
        status: OtpStatus.VERIFIED,
        verified: true,
        verified_at: new Date(),
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to verify OTP for phone: ${phoneNumber}. Error: ${error instanceof Error ? error.message : LogMessages.UNKNOWN_ERROR}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BusinessException(
        error instanceof Error ? error.message : 'Unknown error',
        'TWILIO_VERIFY_OTP_FAILED',
      );
    }
  }

  async resendOtp(
    phoneNumber: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
  ): Promise<OtpServiceResponse> {
    try {
      this.logger.debug(`Attempting to resend OTP to phone: ${phoneNumber}`);
      // there should be last generated otp if user is askinng for new one
      const lastOtp = await this.otpRepository.findOne({
        where: {
          phone_number: phoneNumber,
          purpose,
          status: OtpStatus.PENDING,
        },
        order: { created_at: 'DESC' },
      });

      if (!lastOtp) {
        throw new BusinessException(LogMessages.NO_ACTIVE_OTP, 'NO_ACTIVE_OTP');
      }
      // throwing error if too many attempts occur
      if (lastOtp.resend_count >= MAX_RESEND_ATTEMPTS) {
        throw new BusinessException(
          LogMessages.MAX_RESEND_ATTEMPTS_REACHED,
          'MAX_RESEND_ATTEMPTS_REACHED',
          {
            phone_number: phoneNumber,
          },
        );
      }
      // throwing error if the cool down time is not passed
      const minutesSinceLastSent = differenceInMinutes(new Date(), lastOtp.last_sent_at);
      if (minutesSinceLastSent < RESEND_COOLDOWN_MINUTES) {
        throw new BusinessException(
          `Please wait ${RESEND_COOLDOWN_MINUTES} minutes before requesting a new OTP.`,
          'RESEND_COOLDOWN_MINUTES',
        );
      }

      // Invalidate current OTP
      await this.invalidateExistingOtps(phoneNumber, purpose);

      // Generate and send new OTP
      return this.sendOtp(phoneNumber, purpose);
    } catch (error) {
      this.logger.error(
        `Failed to resend OTP to phone: ${phoneNumber}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BusinessException(
        error instanceof Error ? error.message : 'Unknown error',
        'TWILIO_RESEND_OTP_FAILED',
      );
    }
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.initialized || !this.client || !this.fromNumber) {
      this.logger.warn('Twilio Service is not initialized. Cannot send message.');
      throw new BusinessException(
        'SMS service is not available. Twilio configuration is missing.',
        'TWILIO_SERVICE_NOT_AVAILABLE',
      );
    }
    this.logger.log('MESSAGE_DEEPLINK', message);
    await this.client.messages.create({
      body: message,
      to: to,
      from: this.fromNumber,
    });
  }
}
