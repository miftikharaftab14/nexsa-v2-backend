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
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TwilioService,
    JwtUtils,
    RolesGuard,
    {
      provide: InjectionToken.OTP_SERVICE,
      useClass: TwilioService,
    },
  ],
  exports: [RolesGuard, AuthService, TwilioService],
})
export class AuthModule {}
