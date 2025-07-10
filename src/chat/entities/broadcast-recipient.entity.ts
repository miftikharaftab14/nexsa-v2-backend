import { Entity, PrimaryColumn, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Broadcast } from './broadcast.entity';
import { User } from '../../users/entities/user.entity';

@Entity('broadcast_recipients')
export class BroadcastRecipient {
  @PrimaryColumn({ name: 'broadcast_id' })
  broadcastId: number;

  @PrimaryColumn({ name: 'customer_id', type: 'bigint' })
  customerId: bigint;

  @ManyToOne(() => Broadcast, broadcast => broadcast.recipients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broadcast_id' })
  broadcast: Broadcast;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;
}
