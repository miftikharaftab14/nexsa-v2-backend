import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user.module';
import { ConfigModule } from '@nestjs/config';
import dbConfiguration from './config/dbConfiguration';
import { validate } from './common/validation/env.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from './database/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { ContactsModule } from './contacts/contacts.module';
import { InvitationsModule } from './invitations/invitations.module';
import { FilesModule } from './files/files.module';
import { GalleryImagesModule } from './gallery-image/gallery-images.module';
import { ChatModule } from './chat/chat.module';
import { PreferencesModule } from './preferences/preferences.module';
import { GalleryModule } from './galleries/gallery.module';
import { AdminModule } from './admin/admin.module';
import { BlocksModule } from './blocks/blocks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
      load: [dbConfiguration],
      validate,
    }),
    ChatModule,
    CommonModule,
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    UserModule,
    AuthModule,
    ContactsModule,
    InvitationsModule,
    FilesModule,
    GalleryImagesModule,
    PreferencesModule,
    GalleryModule,
    AdminModule,
    BlocksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
