import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationController } from './controllers/invitation.controller';
import { InvitationService } from './services/invitation.service';
import { Invitation } from './entities/invitation.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { InjectionToken } from 'src/common/constants/injection-tokens';
import { OtpVerification } from 'src/common/entities/otp-verification.entity';
import { SMSInvitationStrategy } from './strategies/sms-invitation.strategy';
import { EmailInvitationStrategy } from './strategies/ email-invitation.strategy';
import { EmailModule } from 'src/common/modules/email.module';
import { ConfigModule } from '@nestjs/config';
import { TwilioMessagingService } from 'src/common/services/twilio-messaging.service';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, Contact, OtpVerification]),
    ConfigModule,
    EmailModule,
    FilesModule,
  ],
  controllers: [InvitationController],
  providers: [
    {
      provide: InjectionToken.INVITATION_SERVICE,
      useClass: InvitationService,
    },
    InvitationService,
    {
      provide: 'IMessagingService',
      useClass: TwilioMessagingService,
    },
    {
      provide: InjectionToken.INVITATION_STRATEGIES,
      useFactory: (smsStrategy: SMSInvitationStrategy, emailStrategy: EmailInvitationStrategy) => [
        smsStrategy,
        emailStrategy,
      ],
      inject: [SMSInvitationStrategy, EmailInvitationStrategy],
    },
    SMSInvitationStrategy,
    EmailInvitationStrategy,
  ],
  exports: [InjectionToken.INVITATION_SERVICE, InvitationService],
})
export class InvitationsModule {}
