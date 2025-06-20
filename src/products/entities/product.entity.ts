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
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { ProductLike } from './product-like.entity'; // ⬅️ Import the like entity

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'media_urls', type: 'text', array: true, default: '{}' })
  mediaUrls: string[];

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, category => category.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'user_id', nullable: true })
  userId: bigint;

  @ManyToOne(() => User, user => user.products)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => ProductLike, like => like.product, { cascade: true }) // ⬅️ Added this
  likes: ProductLike[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
