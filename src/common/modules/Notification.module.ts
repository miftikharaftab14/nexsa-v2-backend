// notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';

@Module({
  providers: [NotificationService],
  exports: [NotificationService], // Export it for use in other modules
})
export class NotificationModule {}
