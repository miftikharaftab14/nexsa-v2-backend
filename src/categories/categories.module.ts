import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoryAssociation } from './entities/category-association.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { UserModule } from '../users/user.module';
import { FilesModule } from '../files/files.module';
import { InvitationsModule } from 'src/invitations/invitations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, CategoryAssociation]),
    UserModule,
    FilesModule,
    InvitationsModule,
  ],
  providers: [CategoriesService],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
