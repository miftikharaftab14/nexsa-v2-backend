import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectVersionsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogContexts } from '../enums/logging.enum';
import * as sharp from 'sharp';
import { Messages } from '../enums/messages.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(LogContexts.S3);

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Missing required AWS configuration');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.bucketName = bucketName;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<{ originalUrl: string; thumbnailUrl?: string }> {
    try {
      const key = `${folder}/${Date.now()}-${file.originalname}`;
      const contentType = file.mimetype;

      // Upload original file
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: contentType,
        }),
      );

      const region: string = this.configService.get('AWS_REGION') || '';
      const originalUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;

      let thumbnailUrl: string | undefined = undefined;

      // If it's an image, generate and upload a thumbnail
      if (contentType.startsWith('image/')) {
        const thumbBuffer = await sharp(file.buffer)
          .resize(200, 200, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .toBuffer();

        const thumbKey = `${folder}/thumbnails/${Date.now()}-thumb-${file.originalname}`;

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: thumbKey,
            Body: thumbBuffer,
            ContentType: contentType,
          }),
        );

        thumbnailUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${thumbKey}`;
      }

      return {
        originalUrl,
        thumbnailUrl,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract the key from the URL
      const key = fileUrl.split('.com/')[1];

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async getFileVersions(key: string): Promise<string[]> {
    try {
      const command = new ListObjectVersionsCommand({
        Bucket: this.bucketName,
        Prefix: key,
      });
      const response = await this.s3Client.send(command);
      return (response.Versions || []).map(version => version.VersionId || '').filter(Boolean);
    } catch (error) {
      this.logger.error(
        `Failed to get file versions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
  /**
   * Generate presigned URLs for file uploads and downloads
   */
  async generatePresignedUrls(
    files: Array<{ fileName: string; fileType: string }>,
    folderPath: string,
  ): Promise<
    Array<{
      fileName: string;
      fileType: string;
      index: number;
      key: string;
      presignedUrl: string;
      getUrl: string;
      cloudFrontUrl: string;
    }>
  > {
    try {
      if (!this.bucketName) {
        throw new NotFoundException(Messages.AWS_S3_BUCKET_NAME_NOT_DEFINED);
      }

      // Ensure folder path ends with /
      const normalizedFolderPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
      const region: string = this.configService.get('AWS_REGION') || '';

      const presignedUrls = await Promise.all(
        files.map(async (file, index) => {
          const uuid = uuidv4();
          // Generate unique key for the file
          const timestamp = Date.now();
          const key = `${normalizedFolderPath}${timestamp}-${uuid}-${file.fileName}`;

          // Generate presigned URL for upload (PUT)
          const putCommand = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: file.fileType,
          });

          // Generate presigned URL for download (GET)
          const getCommand = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          });

          const [presignedUrl, getUrl] = await Promise.all([
            getSignedUrl(this.s3Client, putCommand, { expiresIn: 60 * 60 }), // 1 hour
            getSignedUrl(this.s3Client, getCommand, { expiresIn: 60 * 60 }), // 1 hour
          ]);

          // Generate CloudFront URL
          const cloudFrontDomain = this.configService.get<string>('CLOUDFRONT_DOMAIN');
          const cloudFrontUrl = cloudFrontDomain
            ? `https://${cloudFrontDomain}/${key}`
            : `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;

          return {
            fileName: file.fileName,
            fileType: file.fileType,
            index: index + 1, // 1-based index
            key,
            presignedUrl,
            getUrl,
            cloudFrontUrl,
          };
        }),
      );

      this.logger.log(`Generated ${presignedUrls.length} presigned URLs for folder: ${folderPath}`);

      return presignedUrls;
    } catch (error) {
      this.logger.error(`Error generating presigned URLs: ${error.message}`, error.stack);
      throw error;
    }
  }
  async uploadFileVersion(file: Express.Multer.File, key: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await this.s3Client.send(command);
      return `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(
        `Failed to upload file version: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
