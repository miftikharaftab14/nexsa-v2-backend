import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GalleryImage } from '../../gallery-image/entities/gallery-image.entity';
import { File } from '../../files/entities/file.entity';

@Entity('galleries')
export class Gallery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'user_id', type: 'bigint', nullable: false })
  userId: bigint;

  @ManyToOne(() => User, user => user.galleries)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => GalleryImage, galleryImage => galleryImage.gallery)
  galleryImages: GalleryImage[];

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ name: 'notifications_enabled', type: 'boolean', default: true })
  notificationsEnabled: boolean;

  @Column({ name: 'profile_gallery_image', type: 'bigint', nullable: true })
  profileGalleryImageId: number;

  @ManyToOne(() => File, { nullable: true })
  @JoinColumn({ name: 'profile_gallery_image' })
  profileGalleryImage: File;
}
