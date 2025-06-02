// src/contacts/repositories/contact.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { BaseRepository } from '../../common/repositories/base.repository';

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

  async findBySellerId(sellerId: number): Promise<Contact[]> {
    return this.repository.find({
      where: { seller_id: BigInt(sellerId) },
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
}
