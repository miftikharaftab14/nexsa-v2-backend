import { Injectable, Logger, Inject } from '@nestjs/common';
import { FileRepository } from '../repositories/file.repository';
import { File } from '../entities/file.entity';
import { IS3Service } from '../../common/interfaces/s3-service.interface';
import { InjectionToken } from '../../common/constants/injection-tokens';
import { ConfigService } from '@nestjs/config';
import { LogContexts, LogMessages } from '../../common/enums/logging.enum';
import { BusinessException } from '../../common/exceptions/business.exception';
import { FileSize } from 'src/common/constants/file';

@Injectable()
export class FileService {
  private readonly logger = new Logger(LogContexts.FILE);
  private readonly s3Folder: string;

  constructor(
    @Inject(InjectionToken.S3_SERVICE)
    private readonly s3Service: IS3Service,
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService,
  ) {
    const s3Folder = this.configService.get<string>('AWS_S3_FOLDER_NAME');
    if (!s3Folder) {
      throw new Error(LogMessages.MISSING_AWS_CONFIGURATION);
    }
    this.s3Folder = s3Folder;
  }

  async uploadFile(file: Express.Multer.File, folder?: string): Promise<File> {
    try {
      const url = await this.s3Service.uploadFile(file, folder || this.s3Folder);
      const key = url.split('.com/')[1];
      //   const versions = await this.s3Service.getFileVersions(key);
      //   const versionId = versions[0];

      const fileData = {
        key,
        url,
        originalName: file?.originalname,
        mimeType: file.mimetype,
        size: file.size as FileSize.PROFILE_IMAGE_SIZE,
        folder: folder || this.s3Folder,
        // versionId,
        // version: versions.length,
      };

      return this.fileRepository.create(fileData);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessException(LogMessages.FILE_UPLOAD_FAILED, 'FILE_UPLOAD_FAILED', {
        error: errorMessage,
      });
    }
  }

  async uploadFileVersion(file: Express.Multer.File, fileId: number): Promise<File> {
    try {
      const existingFile = await this.fileRepository.findOneById(fileId);
      if (!existingFile) {
        throw new BusinessException(LogMessages.FILE_NOT_FOUND, 'FILE_NOT_FOUND');
      }

      const url = await this.s3Service.uploadFileVersion(file, existingFile.key);
      const versions = await this.s3Service.getFileVersions(existingFile.key);
      const versionId = versions[0];

      const fileData = {
        key: existingFile.key,
        url,
        originalName: file?.originalname,
        mimeType: file.mimetype,
        size: file.size as FileSize.PROFILE_IMAGE_SIZE,
        folder: existingFile.folder,
        versionId,
        version: versions.length,
        parentVersionId: existingFile.versionId,
      };

      return this.fileRepository.create(fileData);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to upload file version: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessException(LogMessages.FILE_UPLOAD_FAILED, 'FILE_UPLOAD_FAILED', {
        error: errorMessage,
      });
    }
  }

  async getPresignedUrl(fileId: number, expiresIn?: number): Promise<string> {
    try {
      const file = await this.fileRepository.findOneById(fileId);
      if (!file) {
        throw new BusinessException(LogMessages.FILE_NOT_FOUND, 'FILE_NOT_FOUND');
      }
      return this.s3Service.getPresignedUrl(file.key, expiresIn);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessException(LogMessages.FILE_NOT_FOUND, 'FILE_NOT_FOUND', {
        error: errorMessage,
      });
    }
  }
  async getPresignedUrlByKey(fileKey: string, expiresIn?: number): Promise<string> {
    try {
      const file = await this.fileRepository.findOneByKey(fileKey);
      if (!file) {
        throw new BusinessException(LogMessages.FILE_NOT_FOUND, 'FILE_NOT_FOUND');
      }
      return this.s3Service.getPresignedUrl(file.key, expiresIn);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessException(LogMessages.FILE_NOT_FOUND, 'FILE_NOT_FOUND', {
        error: errorMessage,
      });
    }
  }

  async getFileVersions(fileId: number): Promise<File[]> {
    try {
      const file = await this.fileRepository.findOneById(fileId);
      if (!file) {
        throw new BusinessException(LogMessages.FILE_NOT_FOUND, 'FILE_NOT_FOUND');
      }
      return this.fileRepository.find({
        where: { key: file.key },
        order: { version: 'DESC' },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get file versions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessException(LogMessages.FILE_NOT_FOUND, 'FILE_NOT_FOUND', {
        error: errorMessage,
      });
    }
  }

  async deleteFile(id: number): Promise<void> {
    try {
      const file = await this.fileRepository.findOneById(id);
      if (!file) {
        throw new BusinessException(LogMessages.FILE_NOT_FOUND, 'FILE_NOT_FOUND');
      }
      await this.s3Service.deleteFile(file.url);
      await this.fileRepository.softDelete(id);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BusinessException(LogMessages.FILE_DELETE_FAILED, 'FILE_DELETE_FAILED', {
        error: errorMessage,
      });
    }
  }

  async getFile(id: number): Promise<File> {
    const file = await this.fileRepository.findOneById(id);
    if (!file) {
      throw new BusinessException(LogMessages.FILE_NOT_FOUND, 'FILE_NOT_FOUND');
    }
    return file;
  }
}
