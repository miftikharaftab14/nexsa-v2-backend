import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { GalleryImageLike } from '../entities/gallery-image-like.entity';

@Injectable()
export class GalleryImageLikeRepository extends BaseRepository<GalleryImageLike> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(GalleryImageLike, dataSource);
  }

  async findOneByGalleryImageAndCustomer(galleriesId: number, customerId: bigint) {
    return this.repository.findOneBy({ galleryImageId: galleriesId, customerId });
  }

  // Add custom methods if needed
}
