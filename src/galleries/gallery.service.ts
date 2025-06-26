import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gallery } from './entities/gallery.entity';
import { UserService } from '../users/services/user.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { InvitationService } from 'src/invitations/services/invitation.service';
import { FileService } from 'src/files/services/file.service';
import { InjectionToken } from 'src/common/constants/injection-tokens';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(Gallery)
    private galleriesRepository: Repository<Gallery>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly usersService: UserService,
    private readonly invitationService: InvitationService,
    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: FileService,
  ) {}
  async convertProductsPresignedUrl(galleries: Gallery[]) {
    return await Promise.all(
      galleries.map(async gallery => ({
        ...gallery,
        products: await Promise.all(
          (gallery.products || []).map(async product => ({
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
  async create(createGalleryDto: CreateGalleryDto, sellerId: bigint): Promise<Gallery> {
    const user = await this.usersService.findOne(Number(sellerId));
    if (!user) {
      throw new BadRequestException('User not found');
    }
    // Only one gallery with the same name per user
    const existing = await this.galleriesRepository.findOne({
      where: { userId: user.id, name: createGalleryDto.name, is_deleted: false },
    });

    if (existing) {
      throw new BadRequestException('Gallery with this name already exists for this user');
    }
    const gallery = this.galleriesRepository.create({
      name: createGalleryDto.name,
      description: createGalleryDto.description,
      userId: user.id,
      user,
    });
    return this.galleriesRepository.save(gallery);
  }

  async findAll(userId: bigint): Promise<Gallery[]> {
    const galleries: Gallery[] = await this.galleriesRepository.find({
      relations: ['user'],
      where: { userId, is_deleted: false },
    });
    return this.convertProductsPresignedUrl(galleries);
  }

  async findByUserId(
    sellerId: number | bigint,
    userId: number | bigint,
  ): Promise<Gallery[] | null> {
    const user = await this.usersService.findOne(sellerId);
    if (!user) {
      throw new NotFoundException(`User with ID ${sellerId} not found`);
    }

    const usersRelationVarification = await this.invitationService.verifyCustomerSellerRelation(
      userId,
      sellerId,
    );
    if (!usersRelationVarification) {
      throw new ForbiddenException('Unauthorized: you are not allowed to fetch this data.');
    }

    const galleries: Gallery[] = await this.galleriesRepository
      .createQueryBuilder('gallery')
      .select([
        'gallery.id AS gallery_id',
        'gallery.name AS gallery_name',
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
      .leftJoin(
        qb =>
          qb
            .select('p.*')
            .addSelect(
              'ROW_NUMBER() OVER (PARTITION BY p.gallery_id ORDER BY p.created_at DESC)',
              'row_num',
            )
            .from('products', 'p')
            .where('p.user_id = :sellerId', { sellerId })
            .andWhere('p.is_deleted = false'),
        'lp',
        'lp.gallery_id = gallery.id AND lp.row_num <= 3',
      )
      // Join to get total products count
      .leftJoin(
        qb =>
          qb
            .select('p.gallery_id', 'gallery_id')
            .addSelect('COUNT(*)', 'total_products_count')
            .from('products', 'p')
            .where('p.user_id = :sellerId', { sellerId })
            .andWhere('p.is_deleted = false')
            .groupBy('p.gallery_id'),
        'pc',
        'pc.gallery_id = gallery.id',
      )
      .where('gallery.user_id = :sellerId')
      .andWhere('gallery.is_deleted = false')
      .groupBy('gallery.id, gallery.name, pc.total_products_count')
      .orderBy('gallery.id', 'ASC')
      .setParameters({ userId, sellerId }) // Pass both userId and sellerId
      .getRawMany();

    return this.convertProductsPresignedUrl(galleries);
  }

  async findOne(id: number): Promise<Gallery> {
    const gallery = await this.galleriesRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['products'],
    });
    if (!gallery) {
      throw new NotFoundException('Gallery not found');
    }
    const [singleGallery] = await this.convertProductsPresignedUrl([gallery]);
    return singleGallery;
  }

  async update(id: number, updateGalleryDto: UpdateGalleryDto): Promise<Gallery> {
    const gallery = await this.findOne(id);
    Object.assign(gallery, updateGalleryDto);
    return this.galleriesRepository.save(gallery);
  }

  async remove(id: number): Promise<void> {
    await this.productRepository.update({ galleryId: id }, { is_deleted: true });
    await this.galleriesRepository.update(id, { is_deleted: true });
  }
}
