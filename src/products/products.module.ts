import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesModule } from '../categories/categories.module';
import { FilesModule } from '../files/files.module';
import { ProductRepository } from './repository/product.repository';
import { UserModule } from 'src/users/user.module';
import { ProductLike } from './entities/product-like.entity';
import { ProductLikeRepository } from './repository/product-like.repository';
import { ProductLikeService } from './products-like.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductLike]),
    CategoriesModule,
    FilesModule,
    UserModule,
  ],
  providers: [ProductsService, ProductRepository, ProductLikeService, ProductLikeRepository],
  controllers: [ProductsController],
  exports: [ProductsService, ProductLikeService],
})
export class ProductsModule {}
