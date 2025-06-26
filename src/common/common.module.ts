import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from './modules/email.module';
import { NotificationModule } from './modules/Notification.module';
import { S3Service } from './services/s3.service';
import { InjectionToken } from './constants/injection-tokens';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([]), EmailModule, NotificationModule],
  providers: [
    {
      provide: InjectionToken.S3_SERVICE,
      useClass: S3Service,
    },
  ],
  exports: [InjectionToken.S3_SERVICE],
})
export class CommonModule {}
