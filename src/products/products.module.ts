import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesModule } from '../categories/categories.module';
import { FilesModule } from '../files/files.module';
import { ProductRepository } from './repository/product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), CategoriesModule, FilesModule],
  providers: [ProductsService, ProductRepository],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
