import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Category } from '../../categories/entities/category.entity';
import { CategoryAssociation } from '../../categories/entities/category-association.entity';

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

  @OneToMany(() => CategoryAssociation, categoryAssociation => categoryAssociation.seller)
  categoryAssociations: CategoryAssociation[];

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
