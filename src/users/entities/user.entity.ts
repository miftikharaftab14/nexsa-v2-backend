import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { GalleryImage } from '../../gallery-image/entities/gallery-image.entity';
import { GalleryImageLike } from '../../gallery-image/entities/gallery-image-like.entity';
import { UserDeviceToken } from './user-device-token.entity';
import { Gallery } from '../../galleries/entities/gallery.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: bigint;

  @Column({ length: 50, nullable: true })
  username: string;

  @Column({ length: 255, unique: true, nullable: true })
  email: string;

  @Column({ length: 20, nullable: false })
  phone_number: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @OneToMany(() => GalleryImageLike, like => like.customer)
  likes: GalleryImageLike[];

  @OneToMany(() => GalleryImage, galleryImage => galleryImage.user)
  galleryImages: GalleryImage[];

  @Column({ type: 'text', nullable: true })
  profile_picture: string;

  @Column({ type: 'text', nullable: true })
  link: string;

  @Column({ type: 'text', nullable: true })
  about_me: string;

  @Column({ type: 'text', array: true, default: [] })
  preferences: string[];

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ default: false })
  first_message_send: boolean;

  @Column({ default: false })
  first_gallery_open: boolean;

  @OneToMany(() => UserDeviceToken, token => token.user)
  deviceTokens: UserDeviceToken[];

  @OneToMany(() => Gallery, gallery => gallery.user)
  galleries: Gallery[];

  @OneToOne(() => Gallery, gallery => gallery.user)
  gallery: Gallery;

  @Column({ name: 'link_name', type: 'text' })
  link_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
