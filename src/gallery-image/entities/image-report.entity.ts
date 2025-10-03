import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { GalleryImage } from './gallery-image.entity';
import { User } from '../../users/entities/user.entity';

@Entity('image_reports')
@Unique(['galleryImageId', 'customerId'])
@Index(['galleryImageId'])
@Index(['customerId'])
export class ImageReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'gallery_image_id' })
  galleryImageId: number;

  @Column({ name: 'customer_id' })
  customerId: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => GalleryImage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gallery_image_id' })
  galleryImage: GalleryImage;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;
}

