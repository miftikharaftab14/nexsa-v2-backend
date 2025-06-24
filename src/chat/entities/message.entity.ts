import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Broadcast } from './broadcast.entity';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'contact_id', type: 'bigint' })
  contactId: bigint;

  @ManyToOne(() => Contact, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @Column({ name: 'sender_id', type: 'bigint' })
  senderId: bigint;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
    name: 'message_type',
  })
  messageType: MessageType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'media_key', type: 'text', nullable: true })
  mediaKey: string;

  @Column({ name: 'broadcast_id', type: 'int', nullable: true })
  broadcastId?: number;

  @ManyToOne(() => Broadcast, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'broadcast_id' })
  broadcast?: Broadcast;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
