import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserDeviceToken } from '../entities/user-device-token.entity';

@Injectable()
export class UserDeviceTokenService {
  private readonly logger = new Logger('UserDeviceTokenService');

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private get repository() {
    return this.dataSource.getRepository(UserDeviceToken);
  }

  async addOrUpdateToken(
    userId: bigint,
    deviceToken: string,
    deviceType?: string,
    deviceOs?: string,
  ): Promise<UserDeviceToken> {
    try {
      let record = await this.repository.findOneBy({ deviceToken });
      if (record) {
        record.userId = userId;
        record.deviceType = deviceType || '';
        record.deviceOs = deviceOs || '';
        await this.repository.save(record);
        this.logger.log(`Updated device token for user ${userId}`);
        return record;
      }
      record = this.repository.create({
        userId,
        deviceToken,
        deviceType: deviceType || '',
        deviceOs: deviceOs || '',
      });
      await this.repository.save(record);
      this.logger.log(`Added device token for user ${userId}`);
      return record;
    } catch (error) {
      this.logger.error('Failed to add or update device token', error);
      throw new InternalServerErrorException('Failed to add or update device token');
    }
  }

  async removeToken(deviceToken: string): Promise<void> {
    try {
      const record = await this.repository.findOneBy({ deviceToken });
      if (record) {
        await this.repository.remove(record);
        this.logger.log(`Removed device token: ${deviceToken}`);
      }
    } catch (error) {
      this.logger.error('Failed to remove device token', error);
      throw new InternalServerErrorException('Failed to remove device token');
    }
  }

  async getTokensByUser(userId: bigint): Promise<string[]> {
    try {
      const records = await this.repository.findBy({ userId });
      return records.map(r => r.deviceToken);
    } catch (error) {
      this.logger.error('Failed to fetch device tokens for user', error);
      throw new InternalServerErrorException('Failed to fetch device tokens for user');
    }
  }

  async getAllTokens(): Promise<string[]> {
    try {
      const records = await this.repository.find();
      return records.map(r => r.deviceToken);
    } catch (error) {
      this.logger.error('Failed to fetch all device tokens', error);
      throw new InternalServerErrorException('Failed to fetch all device tokens');
    }
  }
}
