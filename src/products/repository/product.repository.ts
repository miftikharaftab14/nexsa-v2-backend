import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Product, dataSource);
  }
  async addMediaUrlsToProduct(productId: number, url: string): Promise<Product> {
    const product = await this.repository.findOne({ where: { id: productId } });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.mediaUrls) {
      product.mediaUrls = [];
    }

    // Add new media URLs only if they are not already present
    if (!product.mediaUrls.includes(url)) {
      product.mediaUrls.push(url);
    }

    return this.repository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.repository.find({ relations: ['gallery'], where: { is_deleted: false } });
  }
  async findAllBySeller(userId: bigint, galleryId: number, customerId: bigint): Promise<Product[]> {
    return this.repository
      .createQueryBuilder('product')
      .leftJoin('product.gallery', 'gallery')
      .leftJoin(
        'product_likes',
        'like',
        'like.product_id = product.id AND like.customer_id = :customerId',
        { customerId },
      )
      .where('product.user_id = :userId', { userId })
      .andWhere('product.gallery_id = :galleryId', { galleryId })
      .andWhere('product.is_deleted = false')
      .select([
        'product.id AS id',
        'product.name AS name',
        'product.description AS description',
        'product.mediaUrls AS "mediaUrls"',
        'product.userId AS "userId"',
        'product.createdAt AS "createdAt"',
        'product.updatedAt AS "updatedAt"',
        'gallery.id AS "galleryId"',
        'gallery.name AS "galleryName"',
        'CASE WHEN like.id IS NOT NULL THEN true ELSE false END AS "liked"',
      ])
      .getRawMany();
  }
  async findbyId(id: number): Promise<Product[]> {
    return this.repository.find({
      where: { id, is_deleted: false },
      relations: ['gallery'],
    });
  }

  async removeMediaUrl(productId: number, url: string): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id: productId },
      relations: ['gallery'],
    });

    if (!product) {
      throw new Error('Product not found');
    }

    product.mediaUrls = (product.mediaUrls || []).filter(media => media !== url);
    return this.repository.save(product);
  }

  async addMediaUrls(productId: number, urls: string[]): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id: productId },
      relations: ['gallery'],
    });

    if (!product) {
      throw new Error('Product not found');
    }

    product.mediaUrls = [...(product.mediaUrls || []), ...urls];
    return this.repository.save(product);
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
