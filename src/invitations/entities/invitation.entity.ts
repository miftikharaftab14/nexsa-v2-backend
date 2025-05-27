// src/contacts/entities/contact-invitation.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contact } from '../../contacts/entities/contact.entity';
import { User } from '../../users/entities/user.entity';
import { InvitationMethod, InvitationStatus } from '../../common/enums/contact-invitation.enum';

@Entity('contact_invitations')
export class Invitation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: bigint;

  @Column({ name: 'seller_id', type: 'bigint' })
  seller_id: bigint;

  @Column({ name: 'contact_id', type: 'bigint' })
  contact_id: bigint;

  @Column({ length: 255, unique: true })
  invite_token: string;

  @Column({ length: 10 })
  method: InvitationMethod;

  @Column({ name: 'invite_sent_at' })
  invite_sent_at: Date;

  @Column({ name: 'invite_cancelled_at', nullable: true })
  invite_cancelled_at: Date;

  @Column({ name: 'invite_accepted_at', nullable: true })
  invite_accepted_at: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;
}
