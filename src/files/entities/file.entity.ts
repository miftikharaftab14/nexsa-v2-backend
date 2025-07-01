import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  url: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column()
  size: number;

  @Column({ nullable: true })
  folder: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ name: 'version_id', nullable: true })
  versionId: string;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'parent_version_id', nullable: true })
  parentVersionId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ nullable: true })
  signedUrl?: string;

  @Column({ name: 'signed_url_expire_at', type: 'timestamp', nullable: true })
  signedUrlExpireAt?: Date;

  @Column({ nullable: true })
  thumbnailSignedUrl?: string;

  @Column({ nullable: true })
  thumbnailKey?: string;

  @Column({ name: 'thumbnail_signed_url_expire_at', type: 'timestamp', nullable: true })
  thumbnailSignedUrlExpireAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: Date })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: Date })
  updatedAt: Date;
}
