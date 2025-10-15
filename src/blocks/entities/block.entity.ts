import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('blocks')
@Index(['blockerId', 'blockedId'], { unique: true })
export class Block {
  @PrimaryGeneratedColumn()
  id: number;

  // The user who initiated the block
  @Column({ type: 'bigint', name: 'blocker_id' })
  blockerId: number;

  // The user who is being blocked
  @Column({ type: 'bigint', name: 'blocked_id' })
  blockedId: number;

  // Optional reason or note
  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}