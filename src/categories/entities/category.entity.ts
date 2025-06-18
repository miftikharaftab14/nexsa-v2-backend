import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { CategoryAssociation } from './category-association.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name' })
  name: string;

  @OneToMany(() => Product, product => product.category)
  products: Product[];

  @OneToMany(() => CategoryAssociation, assoc => assoc.category)
  associations: CategoryAssociation[];

  @Column({ name: 'system_generated', default: false })
  systemGenerated: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
