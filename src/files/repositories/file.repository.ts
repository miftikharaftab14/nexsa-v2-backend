import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindManyOptions } from 'typeorm';
import { File } from '../entities/file.entity';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class FileRepository extends BaseRepository<File> {
  constructor(
    @InjectRepository(File)
    protected readonly repository: Repository<File>,
    protected readonly dataSource: DataSource,
  ) {
    super(File, dataSource);
  }

  async findOneById(id: number): Promise<File | null> {
    return this.repository.findOne({ where: { id } });
  }
  async findOneByKey(key: string): Promise<File | null> {
    return this.repository.findOne({ where: { key } });
  }

  async find(options: FindManyOptions<File> | undefined): Promise<File[]> {
    return this.repository.find(options);
  }

  async create(data: Partial<File>): Promise<File> {
    const file = this.repository.create(data);
    return this.repository.save(file);
  }

  async save(file: File): Promise<File> {
    return this.repository.save(file);
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }
}
