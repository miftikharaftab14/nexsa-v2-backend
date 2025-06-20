import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ProductLikeRepository } from './repository/product-like.repository';
import { ProductRepository } from './repository/product.repository';
import { UserService } from 'src/users/services/user.service';
import { ProductLike } from './entities/product-like.entity';

@Injectable()
export class ProductLikeService {
  private readonly logger = new Logger('ProductLikeService');

  constructor(
    private readonly productLikeRepository: ProductLikeRepository,
    private readonly productRepository: ProductRepository,
    private readonly userService: UserService,
  ) {}

  async likeProduct(productId: number, customerId: bigint): Promise<ProductLike> {
    try {
      this.logger.debug('Attempting to like product', `${productId},${customerId}`);
      const product = await this.productRepository.findOneById(productId);
      if (!product) throw new NotFoundException('Product not found');

      const user = await this.userService.findOne(customerId);
      if (!user) throw new NotFoundException('Customer not found');

      const like = await this.productLikeRepository.findOneByProductAndCustomer(
        productId,
        customerId,
      );
      if (like) throw new ConflictException('Already liked this product');

      const createdLike = await this.productLikeRepository.create({ productId, customerId });
      this.logger.log('Product liked successfully', `${productId},${customerId}`);
      return createdLike;
    } catch (error) {
      this.logger.error('Failed to like product', error);
      throw error instanceof ConflictException || error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to like product');
    }
  }

  async unlikeProduct(productId: number, customerId: bigint): Promise<boolean> {
    try {
      this.logger.debug('Attempting to unlike product', `${productId},${customerId}`);
      const like = await this.productLikeRepository.findOneByProductAndCustomer(
        productId,
        customerId,
      );
      if (like) {
        await this.productLikeRepository.delete(like.id);
        this.logger.log('Product unliked successfully', `${productId},${customerId}`);
        return true;
      }
      this.logger.log('No like found to unlike', `${productId},${customerId}`);
      return false;
    } catch (error) {
      this.logger.error('Failed to unlike product', error);
      throw new InternalServerErrorException('Failed to unlike product');
    }
  }

  async getLikesForProduct(productId: number): Promise<ProductLike[]> {
    try {
      this.logger.debug('Attempting to fetch likes for product', `${productId}`);
      const product = await this.productRepository.findOneById(productId);
      if (!product) throw new NotFoundException('Product not found');

      const likes = await this.productLikeRepository.findAll({ where: { productId } });
      this.logger.log('Fetched likes for product successfully', `${productId}`);
      return likes;
    } catch (error) {
      this.logger.error('Failed to fetch product likes', error);
      throw new InternalServerErrorException('Failed to fetch product likes');
    }
  }
  async getProductLiked(productId: number, customerId: bigint): Promise<boolean> {
    try {
      this.logger.debug(
        `Attempting to fetch likes for product ${productId} by customer ${customerId}`,
      );

      const product = await this.productLikeRepository.findOneByProductAndCustomer(
        productId,
        customerId,
      );
      if (!product) {
        return false;
      }
      this.logger.log('Fetched likes for product successfully', `${productId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to fetch product likes', error);
      throw new InternalServerErrorException('Failed to fetch product likes');
    }
  }

  async getLikesByCustomer(customerId: bigint): Promise<ProductLike[]> {
    try {
      this.logger.debug('Attempting to fetch likes by customer', `${customerId}`);
      const user = await this.userService.findOne(customerId);
      if (!user) throw new NotFoundException('Customer not found');

      const likes = await this.productLikeRepository.findAll({ where: { customerId } });
      this.logger.log('Fetched likes by customer successfully', `${customerId}`);
      return likes;
    } catch (error) {
      this.logger.error('Failed to fetch likes by customer', error);
      throw new InternalServerErrorException('Failed to fetch likes by customer');
    }
  }
}
