import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { UserService } from '../users/services/user.service';
import { UserRole } from '../common/enums/user-role.enum';
import { CategoryAssociation } from './entities/category-association.entity';
import { InvitationService } from 'src/invitations/services/invitation.service';
import { FileService } from 'src/files/services/file.service';
import { InjectionToken } from 'src/common/constants/injection-tokens';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(CategoryAssociation)
    private categoriesAss: Repository<CategoryAssociation>,
    private readonly usersService: UserService,
    private readonly invitationService: InvitationService,
    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: FileService,
  ) {}
  async convertProductsPresignedUrl(categories: Category[]) {
    return await Promise.all(
      categories.map(async category => ({
        ...category,
        products: await Promise.all(
          (category.products || []).map(async product => ({
            ...product,
            mediaUrls: await Promise.all(
              (product.mediaUrls ?? []).map(url =>
                this.fileService.getPresignedUrlByKey(url, 3600),
              ),
            ),
          })),
        ),
      })),
    );
  }

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

  async findAllbySellerId(sellerId: number | bigint, userId: number | bigint): Promise<Category[]> {
    const usersRelationVarification = await this.invitationService.verifyCustomerSellerRelation(
      userId,
      sellerId,
    );
    if (!usersRelationVarification) {
      throw new ForbiddenException('Unauthorized: you are not allowed to fetch this data.');
    }
    const user = await this.usersService.findOne(sellerId);
    if (!user) {
      throw new NotFoundException(`User with ID ${sellerId} not found`);
    }

    const categories: Category[] = await this.categoriesRepository
      .createQueryBuilder('category')
      .select([
        'category.id AS category_id',
        'category.name AS category_name',
        'category.system_generated AS system_generated',
        'pc.total_products_count AS total_products_count',
        `
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', lp.id,
          'name', lp.name,
          'description', lp.description,
          'mediaUrls', lp.media_urls,
          'created_at', lp.created_at,
          'updated_at', lp.updated_at,
          'liked', (
            SELECT EXISTS (
              SELECT 1
              FROM product_likes pl
              WHERE pl.product_id = lp.id AND pl.customer_id = :userId
            )
          )
        )
        ORDER BY lp.created_at DESC
      ) FILTER (WHERE lp.id IS NOT NULL),
      '[]'
    ) AS products
    `,
      ])
      .leftJoin('category_associations', 'ca', 'ca.category_id = category.id')
      .leftJoin('users', 's', 's.id = ca.seller_id')
      .leftJoin(
        qb =>
          qb
            .select('p.*')
            .addSelect(
              'ROW_NUMBER() OVER (PARTITION BY p.category_id ORDER BY p.created_at DESC)',
              'row_num',
            )
            .from('products', 'p')
            .where('p.user_id = :sellerId', { sellerId }),
        'lp',
        'lp.category_id = category.id AND lp.row_num <= 3',
      )
      .leftJoin(
        qb =>
          qb
            .select('p.category_id', 'category_id')
            .addSelect('COUNT(*)', 'total_products_count')
            .from('products', 'p')
            .where('p.user_id = :sellerId', { sellerId })
            .groupBy('p.category_id'),
        'pc',
        'pc.category_id = category.id',
      )
      .where('(s.id = :sellerId OR category.system_generated = true)', { sellerId })
      .andWhere('pc.total_products_count > 0')
      .groupBy('category.id, category.name, category.system_generated, pc.total_products_count')
      .orderBy('category.id', 'ASC')
      .setParameter('userId', userId)
      .getRawMany();

    return this.convertProductsPresignedUrl(categories);
  }
  async findAllPreferences(id: number | bigint): Promise<Category[]> {
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

    return this.categoriesRepository
      .createQueryBuilder('category')
      .distinct(true)
      .leftJoinAndSelect('category.associations', 'association')
      .leftJoinAndSelect('association.seller', 'seller')
      .where('seller.id IN (:...sellerIds)', { sellerIds })
      .orWhere('category.systemGenerated = true')
      .getMany();
  }
  async findAllPreferencesByClient(id: number | bigint) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const acceptedInvitations = await this.invitationService.getAcceptedInvitationsByCustomerId(id);
    const sellerIds = acceptedInvitations.map(inv => inv.contact?.seller?.id);

    if (sellerIds.length <= 0) {
      return [];
    }

    const categoryIds = user.preferences;
    const categories: Category[] = await this.categoriesRepository
      .createQueryBuilder('category')
      .select([
        'category.id AS category_id',
        'category.name AS category_name',
        'category.system_generated AS system_generated',
        'pc.total_products_count AS total_products_count',
        `
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', lp.id,
          'name', lp.name,
          'description', lp.description,
          'mediaUrls', lp.media_urls,
          'created_at', lp.created_at,
          'liked', (
            SELECT EXISTS (
              SELECT 1
              FROM product_likes pl
              WHERE pl.product_id = lp.id AND pl.customer_id = :userId
            )
          )
        )
        ORDER BY lp.created_at DESC
      ) FILTER (WHERE lp.id IS NOT NULL),
      '[]'
    ) AS products
    `,
      ])
      .leftJoin('category_associations', 'ca', 'ca.category_id = category.id')
      .leftJoin('users', 's', 's.id = ca.seller_id')
      .leftJoin(
        qb =>
          qb
            .select('p.*')
            .addSelect(
              'ROW_NUMBER() OVER (PARTITION BY p.category_id ORDER BY p.created_at DESC)',
              'row_num',
            )
            .from('products', 'p')
            .where('p.user_id IN (:...sellerIds)', { sellerIds }), // 🔥 filter products for sellers
        'lp',
        'lp.category_id = category.id AND lp.row_num <= 3',
      )
      .leftJoin(
        qb =>
          qb
            .select('p.category_id', 'category_id')
            .addSelect('COUNT(*)', 'total_products_count')
            .from('products', 'p')
            .where('p.user_id IN (:...sellerIds)', { sellerIds }) // 🔥 filter product count too
            .groupBy('p.category_id'),
        'pc',
        'pc.category_id = category.id',
      )
      .where('category.id IN (:...categoryIds)', { categoryIds })
      .andWhere(
        new Brackets(qb => {
          qb.where('s.id IN (:...sellerIds)', { sellerIds }).orWhere(
            'category.system_generated = true',
          );
        }),
      )
      .andWhere('pc.total_products_count > 0')
      .groupBy('category.id, category.name, category.system_generated, pc.total_products_count')
      .orderBy('category.id', 'ASC')
      .setParameter('userId', id)
      .getRawMany();

    return this.convertProductsPresignedUrl(categories);
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
