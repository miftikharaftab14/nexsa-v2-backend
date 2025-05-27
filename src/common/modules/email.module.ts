import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from '../services/email.service';
import { InjectionToken } from '../constants/injection-tokens';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailService,
    {
      provide: InjectionToken.EMAIL_SERVICE,
      useClass: EmailService,
    },
  ],
  exports: [InjectionToken.EMAIL_SERVICE],
})
export class EmailModule {}
