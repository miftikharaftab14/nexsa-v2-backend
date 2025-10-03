// src/contacts/repositories/contact.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { ContactStatus } from 'src/common/enums/contact-status.enum';
import { SellerInfoType } from '../types/sellers-info-interface';
import { Preference } from 'src/common/entities/preference.entity';

@Injectable()
export class ContactRepository extends BaseRepository<Contact> {
  constructor(
    @InjectDataSource() dataSource: DataSource,
    @InjectRepository(Preference) private readonly preferenceRepo: Repository<Preference>, // Inject Preference repo
  ) {
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
      .innerJoin('users', 'seller', 'seller.id = contact.seller_id AND seller.is_deleted= false ')
      .leftJoin(
        qb =>
          qb
            .select('p.user_id', 'seller_id')
            .addSelect('COUNT(*) FILTER (WHERE ir.id IS NULL)', 'total_gallery_image_count')
            .from('gallery_image', 'p')
            .leftJoin('image_reports', 'ir', 'ir.gallery_image_id = p.id AND ir.customer_id = :customerId')
            .where('p.is_deleted = false')
            .groupBy('p.user_id'),
        'prod_count',
        'prod_count.seller_id = contact.seller_id',
      )
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
        'seller.link_name AS link_name',
        'seller.link AS link',
        'contact.id AS "contactId"',
        'seller.profile_picture AS profile_picture',
        'COALESCE(gallery_count.total_galleries_count, 0) AS total_galleries_count',
        'COALESCE(prod_count.total_gallery_image_count, 0) AS total_gallery_image_count',
      ])
      .where('contact.invited_user_id = :customerId', { customerId: BigInt(customerId) })
      .andWhere('contact.status = :status', { status: ContactStatus.ACCEPTED })
      .getRawMany();
  }

  async findBySellerId(sellerId: number | bigint): Promise<Contact[]> {
    return this.repository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.seller', 'seller')
      .leftJoinAndSelect('contact.invited_user', 'invited_user')
      .where('contact.seller_id = :sellerId', { sellerId })
      .andWhere('(invited_user.is_deleted = false OR invited_user.id IS NULL)')
      .orderBy('contact.created_at', 'DESC')
      .getMany();
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

  async findContactsBySeller(sellerId: bigint) {
    // Fetch contacts with invited user (including profile_picture)
    const contacts = await this.repository
      .createQueryBuilder('contact')
      .leftJoinAndSelect(
        'contact.invited_user',
        'invited_user',
        'invited_user.is_deleted=false OR invited_user.id IS NULL ',
      )
      .where('contact.seller_id = :sellerId', { sellerId })
      .andWhere('contact.status = :status', { status: ContactStatus.ACCEPTED })
      .select([
        'contact',
        'invited_user.id',
        'invited_user.username', // add any other fields you need
        'invited_user.profile_picture',
        'invited_user.preferences',
      ])
      .getMany();

    // Collect all unique preference IDs from invited users
    const allPrefIds = [...new Set(contacts.flatMap(c => c.invited_user?.preferences || []))];

    if (allPrefIds.length === 0) {
      return contacts;
    }

    // Fetch preference records (id + name)
    const preferences = await this.preferenceRepo.findByIds(allPrefIds);

    // Replace preference IDs with names
    contacts.forEach(contact => {
      const matchedNames = preferences
        .filter(pref => (contact.invited_user.preferences || []).includes(String(pref.id)))
        .map(pref => pref.name);

      contact.invited_user.preferences = matchedNames;
    });

    return contacts;
  }
  async findBySellerAndCustomer(seller_id: bigint, invited_user_id: bigint) {
    return this.repository.findOne({
      where: {
        seller_id,
        invited_user_id,
      },
    });
  }

  async findOneNotDeleted(id: bigint) {
    return this.repository.findOne({
      where: [
        { id, invited_user: { is_deleted: false } },
        { id, invited_user: IsNull() },
      ],
    });
  }
}
