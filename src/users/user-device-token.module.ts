import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDeviceToken } from './entities/user-device-token.entity';
import { UserDeviceTokenService } from './services/user-device-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserDeviceToken])],
  providers: [UserDeviceTokenService],
  exports: [UserDeviceTokenService], // <-- make sure it's exported
})
export class UserDeviceTokenModule {}
