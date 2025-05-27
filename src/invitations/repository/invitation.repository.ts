import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Invitation } from '../entities/invitation.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InvitationRepository extends BaseRepository<Invitation> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Invitation, dataSource);
  }
}
