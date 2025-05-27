import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ContactStatus } from '../../common/enums/contact-status.enum';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: bigint;

  @Column({ name: 'seller_id', type: 'bigint' })
  seller_id: bigint;

  @Column({ name: 'invited_user_id', type: 'bigint', nullable: true })
  invited_user_id: bigint;

  @Column({ length: 20 })
  phone_number: string;

  @Column({ name: 'full_name', length: 100, nullable: true })
  full_name: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ContactStatus.NEW,
  })
  status: ContactStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_user_id' })
  invited_user: User;
}
