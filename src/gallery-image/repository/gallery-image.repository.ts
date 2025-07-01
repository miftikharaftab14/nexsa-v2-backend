import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
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
      .createQueryBuilder('galleries')
      .leftJoin('galleries.gallery', 'gallery')
      .leftJoin(
        'galleries_likes',
        'like',
        'like.galleries_id = galleries.id AND like.customer_id = :customerId',
        { customerId },
      )
      .where('galleries.user_id = :userId', { userId })
      .andWhere('galleries.gallery_id = :galleryId', { galleryId })
      .andWhere('galleries.is_deleted = false')
      .select([
        'galleries.id AS id',
        'galleries.media_file_id AS "mediaFileId"',
        'galleries.userId AS "userId"',
        'galleries.createdAt AS "createdAt"',
        'galleries.updatedAt AS "updatedAt"',
        'gallery.id AS "galleryId"',
        'CASE WHEN like.id IS NOT NULL THEN true ELSE false END AS "liked"',
      ])
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

  async softDeleteByGalleryId(galleryId: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update()
      .set({ is_deleted: true })
      .where('gallery_id = :galleryId', { galleryId })
      .execute();
  }
}
