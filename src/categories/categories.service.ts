import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { UserService } from '../users/services/user.service';
import { UserRole } from '../common/enums/user-role.enum';
import { CategoryAssociation } from './entities/category-association.entity';
import { InvitationService } from 'src/invitations/services/invitation.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(CategoryAssociation)
    private categoriesAss: Repository<CategoryAssociation>,
    private readonly usersService: UserService,
    private readonly invitationService: InvitationService,
  ) {}

  async create(createCategoryDto: { name: string; sellerId: string }): Promise<Category> {
    // Verify the user exists and is a seller
    const user = await this.usersService.findOne(Number(createCategoryDto.sellerId));

    if (!user || user.role !== UserRole.SELLER) {
      throw new BadRequestException('Seller not found or user is not a seller');
    }

    // Check if category exists and if seller already has access to it
    const existingCategory = await this.categoriesRepository.findOne({
      where: { name: createCategoryDto.name },
      relations: ['associations', 'associations.seller'],
    });

    if (existingCategory) {
      // Check if seller already has access to this category
      const sellerHasAccess = existingCategory.associations.some(
        assoc => assoc.seller.id === user.id,
      );

      if (sellerHasAccess) {
        throw new BadRequestException('Category with same name already available');
      }

      // Create association for existing category
      const categoryAssociation = this.categoriesAss.create({
        category: existingCategory,
        seller: user,
      });
      await this.categoriesAss.save(categoryAssociation);
      return existingCategory;
    }

    // Create new category and association in a transaction
    const category = this.categoriesRepository.create({
      name: createCategoryDto.name,
    });

    const savedCategory = await this.categoriesRepository.save(category);

    const categoryAssociation = this.categoriesAss.create({
      category: savedCategory,
      seller: user,
    });

    await this.categoriesAss.save(categoryAssociation);

    return savedCategory;
  }

  async findAll(id: number): Promise<Category[]> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    let sellerIds: bigint[] = [];

    if (user.role === UserRole.SELLER) {
      sellerIds = [user.id];
    } else {
      const acceptedInvitations =
        await this.invitationService.getAcceptedInvitationsByCustomerId(id);

      sellerIds = acceptedInvitations.map(inv => inv.contact?.seller?.id);
    }

    // If no seller IDs are found (e.g., no invitations), return only system-generated categories
    if (sellerIds.length === 0) {
      return this.categoriesRepository.find({
        where: { systemGenerated: true },
        relations: ['products'],
      });
    }

    // Fetch categories for the relevant sellers + system-generated ones
    return this.categoriesRepository
      .createQueryBuilder('category')
      .distinct(true)
      .leftJoinAndSelect('category.products', 'product')
      .leftJoinAndSelect('category.associations', 'association')
      .leftJoinAndSelect('association.seller', 'seller')
      .where('seller.id IN (:...sellerIds)', { sellerIds })
      .orWhere('category.systemGenerated = true')
      .getMany();
  }
  async findAllPreferences(id: number): Promise<Category[]> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    let sellerIds: bigint[] = [];

    if (user.role === UserRole.SELLER) {
      sellerIds = [user.id];
    } else {
      const acceptedInvitations =
        await this.invitationService.getAcceptedInvitationsByCustomerId(id);

      sellerIds = acceptedInvitations.map(inv => inv.contact?.seller?.id);
    }

    // If no seller IDs are found (e.g., no invitations), return only system-generated categories
    if (sellerIds.length === 0) {
      return this.categoriesRepository.find({
        where: { systemGenerated: true },
        relations: ['products'],
      });
    }

    // Fetch categories for the relevant sellers + system-generated ones
    return this.categoriesRepository
      .createQueryBuilder('category')
      .distinct(true)
      .leftJoinAndSelect('category.associations', 'association')
      .leftJoinAndSelect('association.seller', 'seller')
      .where('seller.id IN (:...sellerIds)', { sellerIds })
      .orWhere('category.systemGenerated = true')
      .getMany();
  }

  async findAllByUserID(userId: number, search?: string): Promise<Category[]> {
    const queryBuilder = this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'product')
      .leftJoinAndSelect('category.associations', 'association')
      .leftJoinAndSelect('association.seller', 'seller')
      .where('seller.id = :userId', { userId });

    if (search) {
      queryBuilder.andWhere('category.name ILIKE :search', { search: `%${search}%` });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['products', 'associations', 'associations.seller'],
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
    await this.categoriesAss.delete(id);
  }
}
