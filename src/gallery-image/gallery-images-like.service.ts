import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GalleryImageLikeRepository } from './repository/gallery-image-like.repository';
import { GalleryImageRepository } from './repository/gallery-image.repository';
import { UserService } from 'src/users/services/user.service';
import { GalleryImageLike } from './entities/gallery-image-like.entity';

@Injectable()
export class GalleryImageLikeService {
  private readonly logger = new Logger('GalleryImageLikeService');

  constructor(
    private readonly galleryImageLikeRepository: GalleryImageLikeRepository,
    private readonly galleryImageRepository: GalleryImageRepository,
    private readonly userService: UserService,
  ) {}

  async likeGalleryImage(galleriesId: number, customerId: bigint): Promise<GalleryImageLike> {
    try {
      this.logger.debug('Attempting to like galleries', `${galleriesId},${customerId}`);
      const galleries = await this.galleryImageRepository.findOneById(galleriesId);
      if (!galleries) throw new NotFoundException('GalleryImage not found');

      const user = await this.userService.findOne(customerId);
      if (!user) throw new NotFoundException('Customer not found');

      const like = await this.galleryImageLikeRepository.findOneByGalleryImageAndCustomer(
        galleriesId,
        customerId,
      );
      if (like) throw new ConflictException('Already liked this galleries');

      const createdLike = await this.galleryImageLikeRepository.create({
        galleryImageId: galleriesId,
        customerId,
      });
      this.logger.log('GalleryImage liked successfully', `${galleriesId},${customerId}`);
      return createdLike;
    } catch (error) {
      this.logger.error('Failed to like galleries', error);
      throw error instanceof ConflictException || error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to like galleries');
    }
  }

  async unlikeGalleryImage(galleriesId: number, customerId: bigint): Promise<boolean> {
    try {
      this.logger.debug('Attempting to unlike galleries', `${galleriesId},${customerId}`);
      const like = await this.galleryImageLikeRepository.findOneByGalleryImageAndCustomer(
        galleriesId,
        customerId,
      );
      if (like) {
        await this.galleryImageLikeRepository.delete(like.id);
        this.logger.log('GalleryImage unliked successfully', `${galleriesId},${customerId}`);
        return true;
      }
      this.logger.log('No like found to unlike', `${galleriesId},${customerId}`);
      return false;
    } catch (error) {
      this.logger.error('Failed to unlike galleries', error);
      throw new InternalServerErrorException('Failed to unlike galleries');
    }
  }

  async getLikesForGalleryImage(galleriesId: number): Promise<GalleryImageLike[]> {
    try {
      this.logger.debug('Attempting to fetch likes for galleries', `${galleriesId}`);
      const galleries = await this.galleryImageRepository.findOneById(galleriesId);
      if (!galleries) throw new NotFoundException('GalleryImage not found');

      const likes = await this.galleryImageLikeRepository.findAll({ where: { galleriesId } });
      this.logger.log('Fetched likes for galleries successfully', `${galleriesId}`);
      return likes;
    } catch (error) {
      this.logger.error('Failed to fetch galleries likes', error);
      throw new InternalServerErrorException('Failed to fetch galleries likes');
    }
  }
  async getGalleryImageLiked(galleriesId: number, customerId: bigint): Promise<boolean> {
    try {
      this.logger.debug(
        `Attempting to fetch likes for galleries ${galleriesId} by customer ${customerId}`,
      );

      const galleries = await this.galleryImageLikeRepository.findOneByGalleryImageAndCustomer(
        galleriesId,
        customerId,
      );
      if (!galleries) {
        return false;
      }
      this.logger.log('Fetched likes for galleries successfully', `${galleriesId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to fetch galleries likes', error);
      throw new InternalServerErrorException('Failed to fetch galleries likes');
    }
  }

  async getLikesByCustomer(customerId: bigint): Promise<GalleryImageLike[]> {
    try {
      this.logger.debug('Attempting to fetch likes by customer', `${customerId}`);
      const user = await this.userService.findOne(customerId);
      if (!user) throw new NotFoundException('Customer not found');

      const likes = await this.galleryImageLikeRepository.findAll({ where: { customerId } });
      this.logger.log('Fetched likes by customer successfully', `${customerId}`);
      return likes;
    } catch (error) {
      this.logger.error('Failed to fetch likes by customer', error);
      throw new InternalServerErrorException('Failed to fetch likes by customer');
    }
  }
}
