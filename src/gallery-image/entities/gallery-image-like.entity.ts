import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GalleryImage } from './gallery-image.entity';
import { User } from '../../users/entities/user.entity';

@Entity('galleries_likes')
export class GalleryImageLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'galleries_id' })
  galleriesId: number;

  @ManyToOne(() => GalleryImage, galleries => galleries.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'galleries_id' })
  galleries: GalleryImage;

  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: bigint;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
