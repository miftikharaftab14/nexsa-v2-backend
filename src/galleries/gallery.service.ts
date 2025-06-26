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
      where: { userId: user.id, name: createGalleryDto.name },
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

  async findAll(): Promise<Gallery[]> {
    return this.galleriesRepository.find({ relations: ['user'], where: { is_deleted: false } });
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

    const galleries = await this.galleriesRepository.find({
      where: { userId: user.id, is_deleted: false },
      relations: ['products'],
    });
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
