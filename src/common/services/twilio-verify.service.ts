import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { BusinessException } from '../exceptions/business.exception';
import { LogMessages } from '../enums/logging.enum';
import { TwilioVerifyServiceResponse, InterfaceTwilioVerifyService } from '../interfaces/twilio-verify-service.interface';
import { Messages } from '../enums/messages.enum';

@Injectable()
export class TwilioVerifyService implements InterfaceTwilioVerifyService {
    private readonly client: Twilio;
    private verifyServiceSid: string;
    private readonly logger = new Logger(TwilioVerifyService.name);

    constructor(
        private readonly configService: ConfigService,
    ) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        const verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_ID');

        if (!verifyServiceSid) {
            this.logger.error('TWILIO_VERIFY_SERVICE_ID is missing in environment variables');
            throw new BusinessException('TWILIO_VERIFY_SERVICE_ID is required', 'TWILIO_CONFIG_MISSING');
        }

        this.verifyServiceSid = verifyServiceSid;

        if (!accountSid || !authToken) {
            this.logger.error(LogMessages.TWILIO_CONFIG_MISSING);
            throw new BusinessException(LogMessages.TWILIO_CONFIG_MISSING, 'TWILIO_CONFIG_MISSING');
        }

        this.client = new Twilio(accountSid, authToken);
        this.logger.log(LogMessages.TWILIO_SERVICE_INITIALIZED);
    }

    /**
       * Responsible for sending OTP code on the given number via SMS
       * @param toNumber
       * @returns TwilioResponseObject
       */
    async sendAVerificationToken(toNumber: string): Promise<TwilioVerifyServiceResponse> {
        try {
            const verification = await this.client.verify.v2
                .services(this.verifyServiceSid)
                .verifications.create({
                    to: `+${toNumber}`,
                    channel: "sms",
                });

            return {
                success: true,
                message: `OTP sent to ${toNumber}`,
                data: verification.status,
            };
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string; stack?: string };

            this.logger.error(
                `Failed to send OTP to number: ${toNumber}. Got an error: twilio error code > ${err.code} twilio error message ${err.message}`,
                err.stack,
            );

            throw new BusinessException(
                `Got an error: twilio error code > ${err.code} twilio error message ${err.message}`,
                'TWILIO_SEND_OTP_FAILED',
            );
        }
    }

    /**
  * This will check whether the user's provided token is correct.
  * @param toNumber number on which the OTP was sent
  * @param code the code user received and entered back for validation
  * @returns TwilioResponseObject
  */
    async checkTheVerificationToken(
        toNumber: string,
        code: string,
    ): Promise<TwilioVerifyServiceResponse> {
        // Input validations
        if (!toNumber || !code) {
            throw new BusinessException(
                'Phone number and code are required',
                'TWILIO_VERIFICATION_PARAMS_MISSING',
            );
        }

        if (code.length !== 6) {
            throw new BusinessException(
                'Code must be exactly 6 digits long',
                'TWILIO_VERIFICATION_CODE_INVALID',
            );
        }

        if (!/^\d+$/.test(code)) {
            throw new BusinessException(
                'Code must contain only digits',
                'TWILIO_VERIFICATION_CODE_INVALID',
            );
        }

        // if (!/^\+\d{1,15}$/.test(`+${toNumber}`)) {
        //     throw new BusinessException(
        //         'Phone number must be in E.164 format (e.g., +1234567890)',
        //         'TWILIO_VERIFICATION_PHONE_INVALID',
        //     );
        // }

        this.logger.log(`Checking verification for phone number: ${toNumber} with code: ${code}`);

        try {
            const verificationCheck = await this.client.verify.v2
                .services(this.verifyServiceSid)
                .verificationChecks.create({ to: `+${toNumber}`, code });

            if (verificationCheck.valid) {
                return {
                    success: true,
                    message: Messages.OTP_VERIFIED,
                    data: verificationCheck.status,
                };
            } else {
                return {
                    success: false,
                    message: Messages.UNAUTHORIZED,
                    data: verificationCheck.status,
                };
            }
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string; stack?: string };

            this.logger.error(
                `Failed to verify OTP for ${toNumber}. Twilio error code: ${err.code}, message: ${err.message}`,
                err.stack,
            );

            throw new BusinessException(
                `Got an error: twilio error code > ${err.code} twilio error message ${err.message}`,
                'TWILIO_VERIFY_CHECK_FAILED',
            );
        }
    }


}