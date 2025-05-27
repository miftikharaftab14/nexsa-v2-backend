import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './services/s3.service';
import { InjectionToken } from './constants/injection-tokens';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: InjectionToken.S3_SERVICE,
      useClass: S3Service,
    },
  ],
  exports: [InjectionToken.S3_SERVICE],
})
export class CommonModule {}
