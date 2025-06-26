import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { FilesModule } from '../files/files.module';
import { ProductRepository } from './repository/product.repository';
import { UserModule } from 'src/users/user.module';
import { ProductLike } from './entities/product-like.entity';
import { ProductLikeRepository } from './repository/product-like.repository';
import { ProductLikeService } from './products-like.service';
import { UserDeviceTokenModule } from 'src/users/user-device-token.module';
import { NotificationModule } from 'src/common/modules/Notification.module';
import { ContactsModule } from 'src/contacts/contacts.module';
import { GalleryModule } from 'src/galleries/gallery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductLike]),
    GalleryModule,
    FilesModule,
    UserModule,
    UserDeviceTokenModule,
    NotificationModule,
    ContactsModule,
  ],
  providers: [ProductsService, ProductRepository, ProductLikeService, ProductLikeRepository],
  controllers: [ProductsController],
  exports: [ProductsService, ProductLikeService],
})
export class ProductsModule {}
