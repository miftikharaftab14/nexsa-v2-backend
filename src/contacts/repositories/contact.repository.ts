// src/contacts/repositories/contact.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { ContactStatus } from 'src/common/enums/contact-status.enum';
import { SellerInfoType } from '../types/sellers-info-interface';

@Injectable()
export class ContactRepository extends BaseRepository<Contact> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Contact, dataSource);
  }
  async create(data: Partial<Contact>): Promise<Contact> {
    // Ensure seller_id is BigInt
    if (data.seller_id) {
      data.seller_id = BigInt(data.seller_id);
    }
    return super.create(data);
  }
  async findAllSelelrsByCustomer(customerId: bigint): Promise<SellerInfoType[]> {
    return (
      this.repository
        .createQueryBuilder('contact')
        .innerJoin('users', 'seller', 'seller.id = contact.seller_id')

        // Left join subquery to count galleries per seller
        .leftJoin(
          qb =>
            qb
              .select('p.user_id', 'seller_id')
              .addSelect('COUNT(*)', 'total_gallery_image_count')
              .from('gallery_image', 'p')
              .where('p.is_deleted = false')
              .groupBy('p.user_id'),
          'prod_count',
          'prod_count.seller_id = contact.seller_id',
        )

        // Left join subquery to count galleries per seller
        .leftJoin(
          qb =>
            qb
              .select('g.user_id', 'seller_id')
              .addSelect('COUNT(*)', 'total_galleries_count')
              .from('galleries', 'g')
              .where('g.is_deleted = false')
              .groupBy('g.user_id'),
          'gallery_count',
          'gallery_count.seller_id = contact.seller_id',
        )

        .select([
          'contact.seller_id AS id',
          'seller.id AS user_id',
          'seller.username AS username',
          'seller.email AS email',
          'seller.profile_picture AS profile_picture',
          'COALESCE(gallery_count.total_galleries_count, 0) AS total_galleries_count',
          'COALESCE(prod_count.total_gallery_image_count, 0) AS total_gallery_image_count',
        ])
        .where('contact.invited_user_id = :customerId', { customerId: BigInt(customerId) })
        .andWhere('contact.status = :status', { status: ContactStatus.ACCEPTED })
        .getRawMany()
    );
  }

  async findBySellerId(sellerId: number | bigint): Promise<Contact[]> {
    return this.repository.find({
      where: { seller_id: BigInt(sellerId) },
      relations: ['seller'],
      order: { created_at: 'DESC' },
    });
  }
  async findByCustomerId(CustomerId: number): Promise<Contact[]> {
    return this.repository.find({
      where: { invited_user_id: BigInt(CustomerId), status: ContactStatus.ACCEPTED },
      relations: ['seller'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(contactId: number): Promise<Contact | null> {
    return this.repository.findOne({
      where: { id: BigInt(contactId) },
      relations: ['seller', 'invited_user'],
    });
  }

  async findByInvitedUserId(invitedUserId: bigint): Promise<Contact[]> {
    return this.repository.find({
      where: { invited_user_id: BigInt(invitedUserId) },
      relations: ['seller'],
      order: { created_at: 'DESC' },
    });
  }
}
