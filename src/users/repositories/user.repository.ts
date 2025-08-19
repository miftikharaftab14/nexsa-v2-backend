import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { User } from '../entities/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UpdateUserFlagsDto } from '../dto/UpdateUserFlags.dto';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(User, dataSource);
  }

  async addPreference(userId: number, preference: string): Promise<User> {
    const user = await this.repository.findOne({ where: { id: userId as unknown as bigint } });
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.preferences) {
      user.preferences = [];
    }

    if (!user.preferences.includes(preference)) {
      user.preferences.push(preference);
      return this.repository.save(user);
    }

    return user;
  }
  async makeActive(userId: number | string) {
    return this.repository.update(userId, { is_deleted: false });
  }

  async userFlagsUpdate(userId: number | string, updateUserFlagsDto: UpdateUserFlagsDto) {
    const user = await this.repository.findOne({
      where: { id: userId as unknown as bigint },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Apply only provided updates (safe for optional DTO props)
    if (updateUserFlagsDto.first_gallery_open !== undefined) {
      user.first_gallery_open = updateUserFlagsDto.first_gallery_open;
    }

    if (updateUserFlagsDto.first_message_send !== undefined) {
      user.first_message_send = updateUserFlagsDto.first_message_send;
    }

    await this.repository.save(user); // or await user.save();

    return user;
  }

  async removePreference(userId: number, preference: string): Promise<User> {
    const user = await this.repository.findOne({ where: { id: userId as unknown as bigint } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.preferences) {
      user.preferences = user.preferences.filter(p => p !== preference);
      return this.repository.save(user);
    }

    return user;
  }

  async updatePreferences(userId: number, preferences: string[]): Promise<User> {
    const user = await this.repository.findOne({ where: { id: userId as unknown as bigint } });
    if (!user) {
      throw new Error('User not found');
    }

    user.preferences = preferences;
    return this.repository.save(user);
  }

  findByPhone(phoneNumber: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .where('user.phone_number = :phoneNumber', { phoneNumber })
      .getOne();
  }

  findByPhoneAndRole(phoneNumber: string, role: UserRole): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .where('user.phone_number = :phoneNumber', { phoneNumber })
      .andWhere('user.role = :role', { role })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }
  async softDelete(id) {
    return this.repository.update(id, { is_deleted: true });
  }
  async findOneById(id: bigint | number) {
    return this.repository.findOne({
      where: {
        id: BigInt(id),
        is_deleted: false,
      },
    });
  }
}
