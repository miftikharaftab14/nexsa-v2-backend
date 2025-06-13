import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CategoriesService } from '../categories/categories.service';
import { InjectionToken } from '../common/constants/injection-tokens';
import { FileService } from '../files/services/file.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private categoriesService: CategoriesService,
    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: FileService,
  ) {}

  async create(createProductDto: {
    name: string;
    mediaUrls: string[];
    categoryId: number;
    files?: Express.Multer.File[];
  }): Promise<Product> {
    // Verify category exists
    await this.categoriesService.findOne(createProductDto.categoryId);

    // Upload files if provided
    let mediaUrls = createProductDto.mediaUrls || [];
    if (createProductDto.files && createProductDto.files.length > 0) {
      const uploadedFiles = await Promise.all(
        createProductDto.files.map(file => this.fileService.uploadFile(file, 'products')),
      );
      console.log(uploadedFiles);

      mediaUrls = [...mediaUrls, ...uploadedFiles.map(file => file.url)];
    }

    const product = this.productsRepository.create({
      name: createProductDto.name,
      mediaUrls,
      category: { id: createProductDto.categoryId },
    });
    return await this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return await this.productsRepository.find({
      relations: ['category'],
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category'],
    });

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
    },
  ): Promise<Product> {
    if (updateProductDto.categoryId) {
      await this.categoriesService.findOne(updateProductDto.categoryId);
    }

    // Upload new files if provided
    let mediaUrls = updateProductDto.mediaUrls || [];
    if (updateProductDto.files && updateProductDto.files.length > 0) {
      const uploadedFiles = await Promise.all(
        updateProductDto.files.map(file => this.fileService.uploadFile(file, 'products')),
      );
      mediaUrls = [...mediaUrls, ...uploadedFiles.map(file => file.url)];
    }

    const updateData: any = {
      ...updateProductDto,
      mediaUrls,
    };

    if (updateProductDto.categoryId) {
      updateData.category = { id: updateProductDto.categoryId };
      delete updateData.categoryId;
    }

    await this.productsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);

    // Delete associated files from S3
    if (product.mediaUrls && product.mediaUrls.length > 0) {
      await Promise.all(
        product.mediaUrls.map(async url => {
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
    return await this.productsRepository.find({
      where: { category: { id: categoryId } },
      relations: ['category'],
    });
  }
}
