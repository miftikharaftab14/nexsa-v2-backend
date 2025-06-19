import { Injectable, NotFoundException, Inject, UnauthorizedException } from '@nestjs/common';
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
  constructor(
    private readonly productsRepository: ProductRepository,
    private readonly categoriesService: CategoriesService,
    private readonly userService: UserService,

    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: FileService,
  ) {}

  async createProduct(
    dto: CreateProductDto,
    images: Express.Multer.File[],
    sellerId: number | bigint,
  ): Promise<Product> {
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
    return product;
  }

  async findAllBySeller(sellerId: number | bigint): Promise<Product[]> {
    const user = await this.userService.findOne(sellerId);
    if (!user) {
      throw new UnauthorizedException(`User with ID ${sellerId} not found`);
    }
    return this.productsRepository.findAllBySeller(user.id);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOneById(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
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

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
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
  }

  async findByCategory(categoryId: number): Promise<Product[]> {
    return this.productsRepository.findByCategoryId(categoryId);
  }

  async uploadImages(productId: number, files: Express.Multer.File[]): Promise<Product> {
    const uploadedFiles = await Promise.all(
      files.map(file => this.fileService.uploadFile(file, 'products')),
    );

    const fileUrls = uploadedFiles.map(file => file.url);

    return this.productsRepository.addMediaUrls(productId, fileUrls);
  }

  async removeImage(productId: number, imageUrl: string): Promise<Product> {
    const product = await this.findOne(productId);

    product.mediaUrls = product.mediaUrls.filter(url => url !== imageUrl);

    return this.productsRepository.removeMediaUrl(product.id, imageUrl);
  }
}
