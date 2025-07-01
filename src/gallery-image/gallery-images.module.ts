import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryImage } from './entities/gallery-image.entity';
import { GalleryImagesService } from './gallery-images.service';
import { GalleryImagesController } from './gallery-images.controller';
import { FilesModule } from '../files/files.module';
import { GalleryImageRepository } from './repository/gallery-image.repository';
import { UserModule } from 'src/users/user.module';
import { GalleryImageLike } from './entities/gallery-image-like.entity';
import { GalleryImageLikeRepository } from './repository/gallery-image-like.repository';
import { GalleryImageLikeService } from './gallery-images-like.service';
import { UserDeviceTokenModule } from 'src/users/user-device-token.module';
import { NotificationModule } from 'src/common/modules/Notification.module';
import { ContactsModule } from 'src/contacts/contacts.module';
import { GalleryModule } from 'src/galleries/gallery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GalleryImage, GalleryImageLike]),
    GalleryModule,
    FilesModule,
    UserModule,
    UserDeviceTokenModule,
    NotificationModule,
    ContactsModule,
  ],
  providers: [
    GalleryImagesService,
    GalleryImageRepository,
    GalleryImageLikeService,
    GalleryImageLikeRepository,
  ],
  controllers: [GalleryImagesController],
  exports: [GalleryImagesService, GalleryImageLikeService],
})
export class GalleryImagesModule {}
