import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { ProductLike } from '../entities/product-like.entity';

@Injectable()
export class ProductLikeRepository extends BaseRepository<ProductLike> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(ProductLike, dataSource);
  }

  async findOneByProductAndCustomer(productId: number, customerId: bigint) {
    return this.repository.findOneBy({ productId, customerId });
  }

  // Add custom methods if needed
}
