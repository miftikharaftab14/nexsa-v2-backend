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
    return this.repository
      .createQueryBuilder('contact')
      .innerJoin('users', 'seller', 'seller.id = contact.seller_id')
      .leftJoin(
        qb =>
          qb
            .select('p.user_id', 'seller_id')
            .addSelect('COUNT(*)', 'total_products_count')
            .addSelect('COUNT(DISTINCT p.category_id)', 'total_categories_count')
            .from('products', 'p')
            .groupBy('p.user_id'),
        'prod_count',
        'prod_count.seller_id = contact.seller_id',
      )
      .select([
        'contact.seller_id AS id',
        'seller.id AS user_id',
        'seller.username AS username',
        'seller.email AS email',
        'seller.profile_picture AS profile_picture',
        'prod_count.total_categories_count',
        'prod_count.total_products_count',
      ])
      .where('contact.invited_user_id = :customerId', { customerId: BigInt(customerId) })
      .andWhere('contact.status = :status', { status: ContactStatus.ACCEPTED })
      .getRawMany();
  }

  async findBySellerId(sellerId: number): Promise<Contact[]> {
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
