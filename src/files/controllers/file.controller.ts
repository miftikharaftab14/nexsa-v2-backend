import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Query,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from '../services/file.service';
import { File } from '../entities/file.entity';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Messages } from 'src/common/enums/messages.enum';

@ApiTags('Files')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Optional folder path within S3 bucket',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<File> {
    return this.fileService.uploadFile(file, folder);
  }

  @Post(':id/version')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFileVersion(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<File> {
    return this.fileService.uploadFileVersion(file, id);
  }

  @Get(':id/presigned-url')
  @ApiOperation({ summary: 'Generate presigned URL using id. `expiresIn` is in seconds.' })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    type: Number,
    description:
      'Expiration time in seconds for the presigned URL. Default is 3600 seconds (1 hour).',
  })
  async getPresignedUrl(
    @Param('id', ParseIntPipe) id: number,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<string> {
    return this.fileService.getPresignedUrl(id, expiresIn);
  }

  @Get(':key/presigned-url-by-key')
  @ApiOperation({ summary: 'Generate presigned URL using key. `expiresIn` is in seconds.' })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    type: Number,
    description:
      'Expiration time in seconds for the presigned URL. Default is 3600 seconds (1 hour).',
  })
  async getPresignedUrlByKey(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<string> {
    return this.fileService.getPresignedUrlByKey(key, expiresIn);
  }

  @Get(':id/versions')
  async getFileVersions(@Param('id', ParseIntPipe) id: number): Promise<File[]> {
    return this.fileService.getFileVersions(id);
  }

  @Delete(':id')
  async deleteFile(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.fileService.deleteFile(id);
  }

  @Get(':id')
  async getFile(@Param('id', ParseIntPipe) id: number): Promise<File> {
    return this.fileService.getFile(id);
  }

  @Post('presigned-urls')
  @ApiOperation({ summary: 'Generate multiple presigned upload URLs for files' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string', example: 'image1.png' },
              fileType: { type: 'string', example: 'image/png' },
            },
            required: ['fileName', 'fileType', 'uuid'],
          },
          description: 'Array of files to generate presigned URLs for',
        },
        folderPath: {
          type: 'string',
          example: 'uploads/user-uploads',
          description: 'Folder path in the bucket where files will be uploaded',
        },
      },
      required: ['files', 'folderPath'],
    },
  })
  async generatePresignedUrls(
    @Body()
    body: {
      files: Array<{ fileName: string; fileType: string }>;
      folderPath: string;
    },
  ) {
    const { files, folderPath } = body;
    const result = await this.fileService.generatePresignedUrls(files, folderPath);
    return {
      success: true,
      message: Messages.PRESIGNED_URL_GENERATED,
      status: HttpStatus.OK,
      data: result,
    };
  }
}
