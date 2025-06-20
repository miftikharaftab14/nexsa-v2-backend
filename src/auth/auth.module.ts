import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../users/user.module';
import { JwtUtils } from '../common/utils/jwt.utils';
import { RolesGuard } from './guards/roles.guard';
import { TwilioService } from '../common/services/twilio.service';
import { InjectionToken } from '../common/constants/injection-tokens';
import { User } from '../users/entities/user.entity';
import { OtpVerification } from '../common/entities/otp-verification.entity';
import { InvitationsModule } from 'src/invitations/invitations.module';
import { ContactService } from 'src/contacts/services/contact.service';
import { ContactsModule } from 'src/contacts/contacts.module';
import { TwilioVerifyService } from 'src/common/services/twilio-verify.service';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, OtpVerification]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {},
      }),
      inject: [ConfigService],
    }),
    UserModule,
    InvitationsModule,
    ContactsModule,
    FilesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TwilioService,
    TwilioVerifyService,
    JwtUtils,
    RolesGuard,
    {
      provide: InjectionToken.OTP_SERVICE,
      useClass: TwilioVerifyService,
    },
    {
      provide: InjectionToken.CONTACT_SERVICE,
      useClass: ContactService,
    },
  ],
  exports: [
    RolesGuard,
    AuthService,
    TwilioService,
    TwilioVerifyService,
    InjectionToken.CONTACT_SERVICE,
  ],
})
export class AuthModule {}
