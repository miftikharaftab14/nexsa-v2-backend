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

@Entity('gallery_image_likes') // Fixed table name
export class GalleryImageLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'gallery_image_id' }) // Fixed column name
  galleryImageId: number;

  @ManyToOne(() => GalleryImage, galleryImage => galleryImage.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gallery_image_id' }) // Should match column
  galleryImage: GalleryImage;

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
