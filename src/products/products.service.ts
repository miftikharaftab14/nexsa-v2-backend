import {
  Injectable,
  NotFoundException,
  Inject,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ProductRepository } from './repository/product.repository';
import { CategoriesService } from '../categories/categories.service';
import { InjectionToken } from '../common/constants/injection-tokens';
import { FileService } from '../files/services/file.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { UserService } from 'src/users/services/user.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    private readonly productsRepository: ProductRepository,
    private readonly categoriesService: CategoriesService,
    private readonly userService: UserService,

    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: FileService,
  ) {}
  async convertProductListPresignedUrls(products: Product[]) {
    try {
      this.logger.debug('Attempting to convert product list presigned URLs');
      const result = await Promise.all(
        products.map(async product => ({
          ...product,
          mediaUrls: await Promise.all(
            (product.mediaUrls ?? []).map(url => this.fileService.getPresignedUrlByKey(url, 3600)),
          ),
        })),
      );
      this.logger.log('Converted product list presigned URLs successfully');
      return result;
    } catch (error) {
      this.logger.error('Failed to convert product list presigned URLs', error);
      throw new InternalServerErrorException('Failed to convert product list presigned URLs');
    }
  }

  async createProduct(
    dto: CreateProductDto,
    images: Express.Multer.File[],
    sellerId: number | bigint,
  ): Promise<Product> {
    try {
      this.logger.debug('Attempting to create product', String(sellerId));
      const user = await this.userService.findOne(sellerId);
      if (!user) {
        throw new UnauthorizedException(`User with ID ${sellerId} not found`);
      }
      // Validate category exists
      const category: Category = await this.categoriesService.findOne(dto.categoryId);

      // Upload images to storage and get URLs
      const uploadedFiles = await Promise.all(
        images.map(file => this.fileService.uploadFile(file, 'products')),
      );
      const mediaUrls = uploadedFiles.map(file => file.key);

      // Create product entity
      const product = await this.productsRepository.create({
        name: dto.name,
        description: dto.description || '',
        category,
        userId: user.id,
        mediaUrls,
      });
      this.logger.log('Product created successfully', String(product.id));
      return product;
    } catch (error) {
      this.logger.error('Failed to create product', error);
      throw error instanceof UnauthorizedException
        ? error
        : new InternalServerErrorException('Failed to create product');
    }
  }

  async findAllBySeller(sellerId: number | bigint, categoryId: number): Promise<Product[]> {
    try {
      this.logger.debug('Attempting to fetch all products by seller', String(sellerId));
      const user = await this.userService.findOne(sellerId);
      if (!user) {
        throw new UnauthorizedException(`User with ID ${sellerId} not found`);
      }
      const products = await this.productsRepository.findAllBySeller(user.id, categoryId);
      const result = await this.convertProductListPresignedUrls(products);
      this.logger.log('Fetched all products by seller successfully', String(sellerId));
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch all products by seller', error);
      throw error instanceof UnauthorizedException
        ? error
        : new InternalServerErrorException('Failed to fetch all products by seller');
    }
  }

  async findOne(id: number): Promise<Product> {
    try {
      this.logger.debug('Attempting to fetch product', String(id));
      const product = await this.productsRepository.findOneById(id);
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      this.logger.log('Fetched product successfully', String(id));
      return product;
    } catch (error) {
      this.logger.error('Failed to fetch product', error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to fetch product');
    }
  }

  async update(
    id: number,
    updateProductDto: {
      name?: string;
      mediaUrls?: string[];
      categoryId?: number;
      files?: Express.Multer.File[];
      description?: string;
    },
  ): Promise<Product> {
    try {
      this.logger.debug('Attempting to update product', String(id));
      // Ensure product exists
      const product = await this.findOne(id);

      // Validate category if categoryId provided
      if (updateProductDto.categoryId) {
        await this.categoriesService.findOne(updateProductDto.categoryId);
      }

      // Prepare media URLs: start from existing or from DTO
      let mediaUrls = updateProductDto.mediaUrls || product.mediaUrls || [];

      // Upload new files if provided
      if (updateProductDto.files && updateProductDto.files.length > 0) {
        const uploadedFiles = await Promise.all(
          updateProductDto.files.map(file => this.fileService.uploadFile(file, 'products')),
        );
        mediaUrls = [...mediaUrls, ...uploadedFiles.map(file => file.url)];
      }

      // Prepare update data
      const updateData: Partial<Product> = {
        ...updateProductDto,
        mediaUrls,
      };

      // Map categoryId to category relation
      if (updateProductDto.categoryId) {
        const category = await this.categoriesService.findOne(updateProductDto.categoryId);
        if (!category) {
          throw new NotFoundException(`Category with ID ${id} not found`);
        }
        updateData.category = category;
        delete updateData.categoryId;
      }

      await this.productsRepository.update(id, updateData);
      this.logger.log('Product updated successfully', String(id));
      return this.findOne(id);
    } catch (error) {
      this.logger.error('Failed to update product', error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update product');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      this.logger.debug('Attempting to remove product', String(id));
      const product = await this.findOne(id);

      // Delete associated files from storage
      if (product.mediaUrls && product.mediaUrls.length > 0) {
        await Promise.all(
          product.mediaUrls.map(async url => {
            // Extract key from URL - assumes S3 format: https://bucket.s3.region.amazonaws.com/key
            const key = url.split('.com/')[1];
            if (key) {
              await this.fileService.deleteFile(Number(key));
            }
          }),
        );
      }

      await this.productsRepository.delete(id);
      this.logger.log('Product removed successfully', String(id));
    } catch (error) {
      this.logger.error('Failed to remove product', error);
      throw new InternalServerErrorException('Failed to remove product');
    }
  }

  async findByCategory(categoryId: number): Promise<Product[]> {
    try {
      this.logger.debug('Attempting to fetch products by category', String(categoryId));
      const products = await this.productsRepository.findByCategoryId(categoryId);
      this.logger.log('Fetched products by category successfully', String(categoryId));
      return products;
    } catch (error) {
      this.logger.error('Failed to fetch products by category', error);
      throw new InternalServerErrorException('Failed to fetch products by category');
    }
  }

  async uploadImages(productId: number, files: Express.Multer.File[]): Promise<Product> {
    try {
      this.logger.debug('Attempting to upload images for product', String(productId));
      const uploadedFiles = await Promise.all(
        files.map(file => this.fileService.uploadFile(file, 'products')),
      );

      const fileUrls = uploadedFiles.map(file => file.url);

      const product = await this.productsRepository.addMediaUrls(productId, fileUrls);
      this.logger.log('Uploaded images for product successfully', String(productId));
      return product;
    } catch (error) {
      this.logger.error('Failed to upload images for product', error);
      throw new InternalServerErrorException('Failed to upload images for product');
    }
  }

  async removeImage(productId: number, imageUrl: string): Promise<Product> {
    try {
      this.logger.debug('Attempting to remove image from product', String(productId));
      const product = await this.findOne(productId);

      product.mediaUrls = product.mediaUrls.filter(url => url !== imageUrl);

      const updatedProduct = await this.productsRepository.removeMediaUrl(product.id, imageUrl);
      this.logger.log('Removed image from product successfully', String(productId));
      return updatedProduct;
    } catch (error) {
      this.logger.error('Failed to remove image from product', error);
      throw new InternalServerErrorException('Failed to remove image from product');
    }
  }
}
