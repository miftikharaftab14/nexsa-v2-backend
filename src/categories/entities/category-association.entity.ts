import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';

@Entity('category_associations') // ✅ snake_case + plural (good practice)
export class CategoryAssociation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Category, category => category.associations)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => User, user => user.categoryAssociations)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
