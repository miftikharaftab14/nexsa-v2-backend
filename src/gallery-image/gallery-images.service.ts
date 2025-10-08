import {
  Injectable,
  NotFoundException,
  Inject,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GalleryImageRepository } from './repository/gallery-image.repository';
import { InjectionToken } from '../common/constants/injection-tokens';
import { FileService } from '../files/services/file.service';
import { CreateGalleryImageDto } from './dto/create-gallery-image.dto';
import { GalleryImage } from './entities/gallery-image.entity';
import { UserService } from 'src/users/services/user.service';
import { UpdateGalleryImageDto } from './dto/update-gallery-image.dto';
import { UserDeviceTokenService } from '../users/services/user-device-token.service';
import { NotificationService } from '../common/services/notification.service';
import { ContactService } from '../contacts/services/contact.service';
import { GalleryService } from 'src/galleries/gallery.service';
import { Gallery } from 'src/galleries/entities/gallery.entity';
import { ImageReportRepository } from './repository/image-report.repository';
import { ConflictException } from '@nestjs/common';
import { ImageReport } from './entities/image-report.entity';

@Injectable()
export class GalleryImagesService {
  private readonly logger = new Logger('GalleryImagesService');
  constructor(
    private readonly galleryImagesRepository: GalleryImageRepository,
    private readonly galleryService: GalleryService,
    private readonly userService: UserService,
    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: FileService,
    private readonly userDeviceTokenService: UserDeviceTokenService,
    private readonly notificationService: NotificationService,
    private readonly contactService: ContactService,
    private readonly imageReportRepository: ImageReportRepository,
  ) {}

  async convertGalleryImagePresignedUrl(galleryImage: GalleryImage) {
    try {
      this.logger.debug('Attempting to convert gallery image presigned URL');
      let is_video = false;
      if (galleryImage.mediaFileId) {
        const file = await this.fileService.getFile(galleryImage.mediaFileId);
        is_video = file?.mimeType?.startsWith('video/');
      }
      return {
        ...galleryImage,
        mediaUrl: galleryImage.mediaFileId
          ? await this.fileService.getPresignedUrl(galleryImage.mediaFileId, 3600)
          : '',
        is_video,
      };
    } catch (error) {
      this.logger.error('Failed to convert gallery image presigned URL', error);
      throw new InternalServerErrorException('Failed to convert gallery image presigned URL');
    }
  }

  async createGalleryImage(
    dto: CreateGalleryImageDto,
    sellerId: number | bigint,
  ): Promise<GalleryImage[]> {
    try {
      this.logger.debug('Attempting to create gallery image', String(sellerId));
      const user = await this.userService.findOne(sellerId);
      if (!user) {
        throw new UnauthorizedException(`User with ID ${sellerId} not found`);
      }
      // Validate gallery exists
      const gallery: Gallery = await this.galleryService.findOne(dto.galleryId);

      // Only allow one image
      if (dto.image && dto.image?.length <= 0) {
        throw new InternalServerErrorException('At least one image is required');
      }
      const galleryImages: GalleryImage[] = dto.image
        ? await Promise.all(
            dto.image?.map(async file => {
              const uploadedFile = await this.fileService.storeUploadedFile(file);
              // Create gallery image entity
              const galleryImage = await this.galleryImagesRepository.create({
                gallery,
                userId: user.id,
                mediaFileId: uploadedFile.id,
              });
              this.logger.log('GalleryImage created successfully', String(galleryImage.id));
              // Send push notification to all customers of the seller
              if (gallery.notificationsEnabled) {
                try {
                  const contacts = await this.contactService.findBySellerId(sellerId);
                  const customerIds = (contacts.data || [])
                    .map(c => c.invited_user_id)
                    .filter(Boolean);
                  if (customerIds.length > 0) {
                    const tokensArr =
                      await this.userDeviceTokenService.getTokensByUsers(customerIds);
                    const tokens = tokensArr.flat().filter(Boolean);
                    if (tokens.length > 0) {
                      await this.notificationService.sendPushNotification(
                        tokens,
                        'New GalleryImage Available!',
                        `A new gallery image was added in gallery "${gallery.name}" by ${user.username || user.email || 'a seller'}.`,
                        {
                          productId: String(galleryImage.id),
                          galleryId: String(gallery.id),
                          type: 'product',
                          screen: 'CustomerProductDetail',
                        },
                      );
                    }
                  }
                } catch (notifyError) {
                  this.logger.error(
                    'Failed to send push notification after gallery image creation',
                    notifyError,
                  );
                }
              }
              return galleryImage;
            }),
          )
        : [];

      return galleryImages;
    } catch (error) {
      this.logger.error('Failed to create gallery image', error);
      throw error instanceof UnauthorizedException
        ? error
        : new InternalServerErrorException('Failed to create gallery image');
    }
  }

  async findAllBySeller(
    sellerId: number | bigint,
    galleryId: number,
    customerId: bigint,
  ): Promise<GalleryImage[]> {
    try {
      this.logger.debug('Attempting to fetch all gallery images by seller', String(sellerId));
      const user = await this.userService.findOne(sellerId);
      if (!user) {
        throw new UnauthorizedException(`User with ID ${sellerId} not found`);
      }
      const galleryImages = await this.galleryImagesRepository.findAllBySeller(
        user.id,
        galleryId,
        customerId,
      );
      const result = await Promise.all(
        galleryImages.map(galleryImage => this.convertGalleryImagePresignedUrl(galleryImage)),
      );
      this.logger.log('Fetched all gallery images by seller successfully', String(sellerId));
      return result.filter(img => !!img && typeof img.mediaUrl === 'string');
    } catch (error) {
      this.logger.error('Failed to fetch all gallery images by seller', error);
      throw error instanceof UnauthorizedException
        ? error
        : new InternalServerErrorException('Failed to fetch all gallery images by seller');
    }
  }

  async findOne(id: number): Promise<GalleryImage> {
    try {
      this.logger.debug('Attempting to fetch gallery image', String(id));
      const galleryImage = await this.galleryImagesRepository.findOneById(id);
      if (!galleryImage) {
        throw new NotFoundException(`GalleryImage with ID ${id} not found`);
      }
      const result = await this.convertGalleryImagePresignedUrl(galleryImage);
      this.logger.log('Fetched gallery image successfully', String(id));
      if (!result || typeof result.mediaUrl !== 'string') throw new NotFoundException();
      return result as GalleryImage;
    } catch (error) {
      this.logger.error('Failed to fetch gallery image', error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to fetch gallery image');
    }
  }

  async update(id: number, updateGalleryImageDto: UpdateGalleryImageDto): Promise<GalleryImage> {
    try {
      this.logger.debug(`Attempting to update gallery image with ID: ${id}`);
      // Ensure gallery image exists
      const galleryImage = await this.galleryImagesRepository.findOneById(id);
      if (!galleryImage) {
        throw new NotFoundException(`GalleryImage with ID ${id} not found`);
      }
      await this.galleryImagesRepository.update(id, updateGalleryImageDto);
      this.logger.log(`GalleryImage with ID ${id} updated successfully`);
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Failed to update gallery image with ID ${id}`, error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update gallery image');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      this.logger.debug('Attempting to remove gallery image', String(id));
      await this.galleryImagesRepository.softDelete(id);
      this.logger.log('GalleryImage removed successfully', String(id));
    } catch (error) {
      this.logger.error('Failed to remove gallery image', error);
      throw new InternalServerErrorException('Failed to remove gallery image');
    }
  }
  async removeMany(ids: number[]): Promise<void> {
    try {
      this.logger.debug(`Attempting to remove gallery images: [${ids.join(', ')}]`);

      await this.galleryImagesRepository.softDeleteBulk(ids);

      this.logger.log(`Gallery images removed successfully: [${ids.join(', ')}]`);
    } catch (error) {
      this.logger.error('Failed to remove gallery images', error);
      throw new InternalServerErrorException('Failed to remove gallery images');
    }
  }
  async uploadImage(galleryImageId: number, file: Express.Multer.File): Promise<GalleryImage> {
    try {
      this.logger.debug('Attempting to upload image for gallery image', String(galleryImageId));
      const uploadedFile = await this.fileService.uploadFile(file, 'gallery-images');
      await this.galleryImagesRepository.update(galleryImageId, {
        mediaFileId: uploadedFile.id,
      });
      this.logger.log('Uploaded image for gallery image successfully', String(galleryImageId));
      const galleryImage = await this.galleryImagesRepository.findOneById(galleryImageId);
      if (!galleryImage) throw new NotFoundException();
      return galleryImage;
    } catch (error) {
      this.logger.error('Failed to upload image for gallery image', error);
      throw new InternalServerErrorException('Failed to upload image for gallery image');
    }
  }

  async removeImage(galleryImageId: number): Promise<GalleryImage> {
    try {
      this.logger.debug('Attempting to remove image from gallery image', String(galleryImageId));
      await this.galleryImagesRepository.update(galleryImageId, { mediaFileId: undefined });
      this.logger.log('Removed image from gallery image successfully', String(galleryImageId));
      const galleryImage = await this.galleryImagesRepository.findOneById(galleryImageId);
      if (!galleryImage) throw new NotFoundException();
      return galleryImage;
    } catch (error) {
      this.logger.error('Failed to remove image from gallery image', error);
      throw new InternalServerErrorException('Failed to remove image from gallery image');
    }
  }

  async softDeleteByGalleryId(galleryId: number): Promise<void> {
    await this.galleryImagesRepository.softDeleteByGalleryId(galleryId);
  }

  async reportImage(imageId: number, customerId: number, description?: string): Promise<ImageReport> {
    try {
      this.logger.debug(`Attempting to report image ${imageId} by customer ${customerId}`);

      // Check if image exists
      const galleryImage = await this.galleryImagesRepository.findOneById(imageId);
      if (!galleryImage) {
        throw new NotFoundException('Gallery image not found');
      }

      // Check if already reported by this customer
      const existingReport = await this.imageReportRepository.findByImageAndCustomer(imageId, customerId);
      if (existingReport) {
        throw new ConflictException('Image has already been reported by this customer');
      }

      // Create the report
      const report = await this.imageReportRepository.create({
        galleryImageId: imageId,
        customerId,
        description,
      });

      this.logger.log(`Image ${imageId} reported successfully by customer ${customerId}`);
      return report;
    } catch (error) {
      this.logger.error(`Failed to report image ${imageId}`, error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to report image');
    }
  }

  async getReportedImages(): Promise<any[]> {
    try {
      this.logger.debug('Attempting to get reported images');
      const reports = await this.imageReportRepository.getReportedImagesWithCount();
      this.logger.log('Reported images fetched successfully');
      console.log(reports);
      const result = await Promise.all(
        reports.map(galleryImage => this.convertGalleryImagePresignedUrl(galleryImage)),
      );
      return result.filter(img => !!img && typeof img.mediaUrl === 'string');
    } catch (error) {
      this.logger.error('Failed to get reported images', error);
      throw new InternalServerErrorException('Failed to get reported images');
    }
  }

  async deleteReportedImage(imageId: number): Promise<void> {
    try {
      this.logger.debug(`Attempting to delete reported image ${imageId}`);

      // Check if image exists
      const galleryImage = await this.galleryImagesRepository.findOneById(imageId);
      if (!galleryImage) {
        throw new NotFoundException('Gallery image not found');
      }

      // Delete associated reports first
      await this.imageReportRepository.deleteByImageId(imageId);

      // Delete the image
      await this.galleryImagesRepository.softDelete(imageId);

      this.logger.log(`Reported image ${imageId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete reported image ${imageId}`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete reported image');
    }
  }
}
