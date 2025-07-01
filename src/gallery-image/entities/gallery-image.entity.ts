import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GalleryImageLike } from './gallery-image-like.entity';
import { Gallery } from '../../galleries/entities/gallery.entity';
import { File } from '../../files/entities/file.entity';

@Entity('gallery_image')
export class GalleryImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'media_file_id', type: 'bigint', nullable: true })
  mediaFileId: number;

  @ManyToOne(() => File, { nullable: true })
  @JoinColumn({ name: 'media_file_id' })
  mediaFile: File;

  @Column({ name: 'gallery_id', nullable: true })
  galleryId: number;

  @ManyToOne(() => Gallery, gallery => gallery.galleryImages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gallery_id' })
  gallery: Gallery;

  @Column({ name: 'user_id', nullable: true })
  userId: bigint;

  @ManyToOne(() => User, user => user.galleryImages)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => GalleryImageLike, like => like.galleries, { cascade: true })
  likes: GalleryImageLike[];

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ default: false })
  on_sale: boolean;

  @Column({ type: 'numeric', nullable: true })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
