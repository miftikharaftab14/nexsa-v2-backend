import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { BusinessException } from '../exceptions/business.exception';
import { LogMessages } from '../enums/logging.enum';
import { Messages } from '../enums/messages.enum';
import { InterfaceTwilioMessagingService, TwilioMessagingServiceResponse } from '../interfaces/twilio-messaging-service.interface';

@Injectable()
export class TwilioMessagingService implements InterfaceTwilioMessagingService {
    private readonly client: Twilio;
    private messagingServiceSid: string;
    private readonly fromNumber;
    private readonly logger = new Logger(TwilioMessagingService.name);

    constructor(
        private readonly configService: ConfigService,
    ) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
        const messagingServiceSid = this.configService.get<string>('TWILIO_MESSAGING_SERVICE_ID');

        if (!messagingServiceSid) {
            this.logger.error('TWILIO_MESSAGING_SERVICE_ID is missing in environment variables');
            throw new BusinessException('TWILIO_MESSAGING_SERVICE_ID is required', 'TWILIO_CONFIG_MISSING');
        }

        this.messagingServiceSid = messagingServiceSid;
        this.fromNumber = fromNumber;

        // Validate Twilio configuration
        if (!accountSid || !authToken) {
            this.logger.error(LogMessages.TWILIO_CONFIG_MISSING);
            throw new BusinessException(LogMessages.TWILIO_CONFIG_MISSING, 'TWILIO_CONFIG_MISSING');
        }

        this.client = new Twilio(accountSid, authToken);
        this.logger.log(LogMessages.TWILIO_SERVICE_INITIALIZED);
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
        // Validate phone number format
        // if (!/^\+\d{1,15}$/.test(`+${toNumber}`)) {
        //     throw new BusinessException(
        //         'Phone number must be in E.164 format (e.g., +1234567890)',
        //         'TWILIO_VERIFICATION_PHONE_INVALID',
        //     );
        // }

        this.logger.log(`Checking verification for phone number: ${toNumber} with message body: ${messageBody}`);

        try {
            const message = await this.client.messages
                .create({
                    body: messageBody,
                    to: toNumber,
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
                `Failed to send SMS for ${toNumber}. Twilio error code: ${err.code}, message: ${err.message}`,
                err.stack,
            );

            throw new BusinessException(
                `Got an error: twilio error code > ${err.code} twilio error message ${err.message}`,
                'TWILIO_SEND_SMS_FAILED',
            );
        }
    }


}