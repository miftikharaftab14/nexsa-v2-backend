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
import { GalleryImage } from 'src/gallery-image/entities/gallery-image.entity';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(Gallery)
    private galleriesRepository: Repository<Gallery>,
    @InjectRepository(GalleryImage)
    private galleryImageRepository: Repository<GalleryImage>,
    private readonly usersService: UserService,
    private readonly invitationService: InvitationService,
    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: FileService,
  ) {}
  async convertGalleryImagesPresignedUrl(galleries: Gallery[]): Promise<Gallery[]> {
    return await Promise.all(
      galleries.map(async gallery => {
        return {
          ...gallery,
          profileThumbnail: await this.fileService.getThumbnailPresignedUrl(
            gallery.profileGalleryImageId,
            3600,
          ),
          profileGallery: await this.fileService.getPresignedUrl(
            gallery.profileGalleryImageId,
            3600,
          ),
          galleryImages: await Promise.all(
            (gallery.galleryImages || gallery['gallery_images'] || []).map(async galleries => ({
              ...galleries,
              mediaUrl: await this.fileService.getPresignedUrl(galleries['mediaFileId'], 3600),
              mediaThumbnail: await this.fileService.getThumbnailPresignedUrl(
                galleries['mediaFileId'],
                3600,
              ),
            })),
          ),
        };
      }),
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
    return this.convertGalleryImagesPresignedUrl(galleries);
  }

  async findByUserId(
    sellerId: number | bigint,
    userId: number | bigint,
  ): Promise<Gallery[] | null> {
    console.log({ userId, sellerId });
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
        'gallery.id AS id',
        'gallery.name AS name',
        'pc.total_gallery_image_count AS total_gallery_image_count',
        `
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', lp.id,
            'media_file_id', lp.media_file_id,
            'created_at', lp.created_at,
            'updated_at', lp.updated_at,
            'liked', (
              SELECT EXISTS (
                SELECT 1
                FROM gallery_image_likes pl
                WHERE pl.gallery_image_id = lp.id AND pl.customer_id = :userId
              )
            )
          )
          ORDER BY lp.created_at DESC
        ) FILTER (WHERE lp.id IS NOT NULL),
        '[]'
      ) AS "galleryImages"
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
            .from('gallery_image', 'p')
            .where('p.user_id = :sellerId', { sellerId })
            .andWhere('p.is_deleted = false'),
        'lp',
        'lp.gallery_id = gallery.id AND lp.row_num <= 3',
      )
      // Join to get total gallery_image count
      .leftJoin(
        qb =>
          qb
            .select('p.gallery_id', 'gallery_id')
            .addSelect('COUNT(*)', 'total_gallery_image_count')
            .from('gallery_image', 'p')
            .where('p.user_id = :sellerId', { sellerId })
            .andWhere('p.is_deleted = false')
            .groupBy('p.gallery_id'),
        'pc',
        'pc.gallery_id = gallery.id',
      )
      .where('gallery.user_id = :sellerId')
      .andWhere('gallery.is_deleted = false')
      .groupBy('gallery.id, gallery.name, pc.total_gallery_image_count')
      .orderBy('gallery.id', 'ASC')
      .setParameters({ userId, sellerId }) // Pass both userId and sellerId
      .getRawMany();

    return this.convertGalleryImagesPresignedUrl(galleries);
  }

  async findOne(id: number): Promise<Gallery> {
    const gallery = await this.galleriesRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['galleryImages'],
    });
    if (!gallery) {
      throw new NotFoundException('Gallery not found');
    }
    const [singleGallery] = await this.convertGalleryImagesPresignedUrl([gallery]);
    return singleGallery;
  }

  async update(
    id: number,
    updateGalleryDto: UpdateGalleryDto,
    image?: Express.Multer.File,
  ): Promise<Gallery> {
    const gallery = await this.findOne(id);
    Object.assign(gallery, updateGalleryDto);
    if (image) {
      const uploadedFile = await this.fileService.uploadFile(image);
      gallery.profileGalleryImageId = uploadedFile.id;
    }
    return this.galleriesRepository.save(gallery);
  }

  async remove(id: number): Promise<void> {
    await this.galleryImageRepository.update({ galleryId: id }, { is_deleted: true });
    await this.galleriesRepository.update(id, { is_deleted: true });
  }
}
