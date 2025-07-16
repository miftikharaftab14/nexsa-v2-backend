import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { GalleryImage } from '../entities/gallery-image.entity';

@Injectable()
export class GalleryImageRepository extends BaseRepository<GalleryImage> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(GalleryImage, dataSource);
  }

  async findAll(): Promise<GalleryImage[]> {
    return this.repository.find({ relations: ['gallery'], where: { is_deleted: false } });
  }

  async findAllBySeller(
    userId: bigint,
    galleryId: number,
    customerId: bigint,
  ): Promise<GalleryImage[]> {
    return this.repository
      .createQueryBuilder('gi') // alias for gallery_image
      .leftJoin('galleries', 'g', 'g.id = gi.gallery_id')
      .leftJoin(
        'gallery_image_likes',
        'like',
        'like.gallery_image_id = gi.id AND like.customer_id = :customerId',
        { customerId },
      )
      .where('gi.user_id = :userId', { userId })
      .andWhere('gi.gallery_id = :galleryId', { galleryId })
      .andWhere('gi.is_deleted = false')
      .select([
        'gi.id AS id',
        'gi.media_file_id AS "mediaFileId"',
        'gi.user_id AS "userId"',
        'gi.created_at AS "createdAt"',
        'gi.on_sale AS "on_sale"',
        'gi.price AS "price"',
        'gi.updated_at AS "updatedAt"',
        'g.id AS "galleryId"',
        'CASE WHEN like.id IS NOT NULL THEN true ELSE false END AS "liked"',
      ])
      .orderBy('gi.created_at', 'DESC')
      .getRawMany();
  }

  async findbyId(id: number): Promise<GalleryImage[]> {
    return this.repository.find({
      where: { id, is_deleted: false },
      relations: ['gallery'],
    });
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.update(id, { is_deleted: true });
  }
  async softDeleteBulk(ids: number[]): Promise<void> {
    await this.repository.update({ id: In(ids) }, { is_deleted: true });
  }

  async softDeleteByGalleryId(galleryId: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update()
      .set({ is_deleted: true })
      .where('gallery_id = :galleryId', { galleryId })
      .execute();
  }
}
