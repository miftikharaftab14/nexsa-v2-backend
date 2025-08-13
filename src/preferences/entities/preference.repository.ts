import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Preference } from '../../common/entities/preference.entity';

@Injectable()
export class PreferenceRepository extends BaseRepository<Preference> {
  constructor(protected dataSource: DataSource) {
    super(Preference, dataSource);
  }

  async findByName(name: string): Promise<Preference | null> {
    return this.repository.findOne({ where: { name } });
  }
  async findByNameANDUserId(name: string, userId: bigint): Promise<Preference | null> {
    return this.repository.findOne({ where: { name, userId } });
  }
  async addNew(name: string, userId: bigint): Promise<Preference> {
    // Check if preference already exists for this user
    const existing = await this.repository.findOne({
      where: { name, userId },
    });

    if (existing) {
      throw new BadRequestException(`Preference "${name}" already exists for this user.`);
    }

    // Create and save the new preference
    const pref = this.repository.create({ name, userId });
    return await this.repository.save(pref);
  }

  async findAllPreferences(userId: bigint): Promise<Preference[]> {
    return this.repository.find({
      where: [
        { userId: IsNull() }, // system preferences
        { userId: userId }, // user-specific preferences
      ],
      order: { name: 'ASC' },
    });
  }
}
