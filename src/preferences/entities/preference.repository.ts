import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
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

  async findAllPreferences(): Promise<Preference[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }
}
