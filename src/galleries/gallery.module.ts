import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gallery } from './entities/gallery.entity';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { UserModule } from '../users/user.module';
import { InvitationsModule } from 'src/invitations/invitations.module';
import { FilesModule } from 'src/files/files.module';
import { GalleryImage } from 'src/gallery-image/entities/gallery-image.entity';
import { BlocksModule } from 'src/blocks/blocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gallery, GalleryImage]),
    UserModule,
    InvitationsModule,
    FilesModule,
    BlocksModule,
  ],
  providers: [GalleryService],
  controllers: [GalleryController],
  exports: [GalleryService],
})
export class GalleryModule {}
