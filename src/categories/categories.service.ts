import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { UserService } from '../users/services/user.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private readonly usersService: UserService,
  ) {}

  async create(createCategoryDto: { name: string; userId: string }): Promise<Category> {
    // Verify the user exists and is a seller
    const user = await this.usersService.findOne(Number(createCategoryDto.userId));

    if (!user || user.role !== UserRole.SELLER) {
      throw new BadRequestException('Seller not found or user is not a seller');
    }

    const category = this.categoriesRepository.create({
      name: createCategoryDto.name,
      user: { id: BigInt(createCategoryDto.userId) },
    });

    return await this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return await this.categoriesRepository.find({
      relations: ['products', 'user'],
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['products', 'user'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: { name?: string }): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name) {
      category.name = updateCategoryDto.name;
    }

    return await this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    await this.categoriesRepository.delete(id);
  }
}
