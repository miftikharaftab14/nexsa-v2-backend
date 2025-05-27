import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { FileController } from './controllers/file.controller';
import { FileService } from './services/file.service';
import { FileRepository } from './repositories/file.repository';
import { S3Service } from '../common/services/s3.service';
import { InjectionToken } from '../common/constants/injection-tokens';

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  controllers: [FileController],
  providers: [
    FileService,
    FileRepository,
    {
      provide: InjectionToken.S3_SERVICE,
      useClass: S3Service,
    },
    {
      provide: InjectionToken.FILE_SERVICE,
      useClass: FileService,
    },
  ],
  exports: [InjectionToken.FILE_SERVICE],
})
export class FilesModule {}
