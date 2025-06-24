import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BroadcastRecipient } from './broadcast-recipient.entity';

@Entity('broadcasts')
export class Broadcast {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'seller_id', type: 'bigint' })
  sellerId: bigint;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column()
  name: string;

  @OneToMany(() => BroadcastRecipient, recipient => recipient.broadcast, { cascade: true })
  recipients: BroadcastRecipient[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
