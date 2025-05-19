import { Repository, DataSource, EntityTarget, ObjectLiteral, DeepPartial } from 'typeorm';

export abstract class BaseRepository<T extends ObjectLiteral> {
  protected readonly repository: Repository<T>;

  constructor(
    protected readonly entity: EntityTarget<T>,
    protected readonly dataSource: DataSource,
  ) {
    this.repository = this.dataSource.getRepository(this.entity);
  }

  findAll(): Promise<T[]> {
    return this.repository.find();
  }

  findOneById(id: number | string): Promise<T | null> {
    return this.repository.findOneBy({ id } as any);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as DeepPartial<T>);
    const response = await this.repository.save(entity);
    return response;
  }

  async update(id: number | string, data: Partial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return await this.findOneById(id);
  }

  async delete(id: number | string): Promise<void> {
    await this.repository.delete(id);
  }

  // Optional: expose native repository if needed
  getRepository(): Repository<T> {
    return this.repository;
  }
}
