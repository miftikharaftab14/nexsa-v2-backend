import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gallery } from './entities/gallery.entity';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { UserModule } from '../users/user.module';
import { InvitationsModule } from 'src/invitations/invitations.module';
import { FilesModule } from 'src/files/files.module';
import { Product } from 'src/products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gallery, Product]),
    UserModule,
    InvitationsModule,
    FilesModule,
  ],
  providers: [GalleryService],
  controllers: [GalleryController],
  exports: [GalleryService],
})
export class GalleryModule {}
