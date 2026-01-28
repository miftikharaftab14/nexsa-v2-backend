import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { BusinessException } from '../exceptions/business.exception';
import { LogMessages } from '../enums/logging.enum';
import { Messages } from '../enums/messages.enum';
import { InterfaceTwilioMessagingService, TwilioMessagingServiceResponse } from '../interfaces/twilio-messaging-service.interface';
import { normalizePhoneToE164 } from '../utils/phone.util';

@Injectable()
export class TwilioMessagingService implements InterfaceTwilioMessagingService {
    private readonly client: Twilio | null = null;
    private messagingServiceSid: string | undefined = undefined;
    private readonly fromNumber: string | undefined = undefined;
    private readonly logger = new Logger(TwilioMessagingService.name);
    private initialized = false;

    constructor(
        private readonly configService: ConfigService,
    ) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
        const messagingServiceSid = this.configService.get<string>('TWILIO_MESSAGING_SERVICE_ID');

        if (!messagingServiceSid) {
            this.logger.warn('TWILIO_MESSAGING_SERVICE_ID is missing in environment variables. SMS messaging will be disabled.');
            return;
        }

        // Validate Twilio configuration
        if (!accountSid || !authToken) {
            this.logger.warn('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing. SMS messaging will be disabled.');
            return;
        }

        try {
            this.messagingServiceSid = messagingServiceSid;
            this.fromNumber = fromNumber;
            this.client = new Twilio(accountSid, authToken);
            this.initialized = true;
            this.logger.log(LogMessages.TWILIO_SERVICE_INITIALIZED);
        } catch (error) {
            this.logger.error('Failed to initialize Twilio Messaging Service', error);
            this.logger.warn('SMS messaging will be disabled.');
        }
    }



    /**
    *
    * @param toNumber
    * @param body
    * @returns
    */
    async sendSMSWithMessagingService(
        toNumber: string,
        messageBody: string,
    ): Promise<TwilioMessagingServiceResponse> {
        // Input validations
        if (!toNumber || !messageBody) {
            throw new BusinessException(
                'Phone number and code are required',
                'TWILIO_VERIFICATION_PARAMS_MISSING',
            );
        }

        if (!this.initialized || !this.client || !this.messagingServiceSid || !this.fromNumber) {
            this.logger.warn('Twilio Messaging Service is not initialized. Cannot send SMS.');
            throw new BusinessException(
                'SMS service is not available. Twilio configuration is missing.',
                'TWILIO_SERVICE_NOT_AVAILABLE',
            );
        }

        const normalizedTo = normalizePhoneToE164(toNumber, 'US');

        this.logger.log(
            `Checking verification for phone number: ${normalizedTo} with message body: ${messageBody}`,
        );

        try {
            const message = await this.client.messages
                .create({
                    body: messageBody,
                    to: normalizedTo,
                    from: this.fromNumber,
                    messagingServiceSid: this.messagingServiceSid
                })


            return {
                success: true,
                message: Messages.INVITATION_CREATED,
                data: message.status,
            };

        } catch (error: unknown) {
            const err = error as { code?: string; message?: string; stack?: string };

            this.logger.error(
                `Failed to send SMS for ${normalizedTo}. Twilio error code: ${err.code}, message: ${err.message}`,
                err.stack,
            );

            throw new BusinessException(
                `Got an error: twilio error code > ${err.code} twilio error message ${err.message}`,
                'TWILIO_SEND_SMS_FAILED',
            );
        }
    }


}