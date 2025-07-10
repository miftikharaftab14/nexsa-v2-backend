import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { GalleryImagesService } from './gallery-images.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateGalleryImageDto } from './dto/create-gallery-image.dto';
import { Messages } from 'src/common/enums/messages.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUserType } from 'src/common/types/current-user.interface';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { GalleryImageLikeService } from './gallery-images-like.service';
import { UpdateGalleryImageDto } from './dto/update-gallery-image.dto';

@ApiTags('gallery-image') // Swagger group
@ApiBearerAuth() // Apply JWT auth header globally
@Controller('gallery-image')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes with auth guards
@ApiBearerAuth('JWT-auth') // Swagger JWT header name
export class GalleryImagesController {
  constructor(
    private readonly galleryImagesService: GalleryImagesService,
    private readonly galleryImagesLikeService: GalleryImageLikeService,
  ) {}

  /**
   * Create a new gallery-image with a single image
   * Only accessible by SELLER roles
   */
  @Post()
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Create gallery-image with a single image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        galleryId: { type: 'number', example: 1 },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Single gallery-image file',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'GalleryImage created successfully' })
  async createGalleryImage(
    @Body() createGalleryImageDto: CreateGalleryImageDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    const result = await this.galleryImagesService.createGalleryImage(
      createGalleryImageDto,
      currentUser.userId,
    );
    return {
      success: true,
      message: Messages.PRODUCT_CREATED,
      status: HttpStatus.CREATED,
      data: result,
    };
  }

  /**
   * Like a gallery-image as the current user
   */
  @Post('like/:galleryId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Like a gallery-image by its ID' })
  @ApiParam({
    name: 'galleryId',
    type: Number,
    description: 'GalleryImage ID that you want to like',
  })
  async likeGalleryImage(
    @Param('galleryId', ParseIntPipe) galleryId: number,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    const result = await this.galleryImagesLikeService.likeGalleryImage(
      galleryId,
      currentUser.userId,
    );
    return {
      success: true,
      message: Messages.PRODUCTS_LIKED,
      status: HttpStatus.OK,
      data: result,
    };
  }
  /**
   * Unlike a gallery-image as the current user
   */
  @Delete('like/:galleryId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Unlike a gallery-image by its ID' })
  @ApiParam({
    name: 'galleryId',
    type: Number,
    description: 'GalleryImage ID that you want to like',
  })
  async unlikeGalleryImage(
    @Param('galleryId', ParseIntPipe) galleryId: number,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    const result = await this.galleryImagesLikeService.unlikeGalleryImage(
      galleryId,
      currentUser.userId,
    );
    return {
      success: true,
      message: Messages.PRODUCTS_UNLIKED,
      status: HttpStatus.OK,
      data: result,
    };
  }
  /**
   * get all liked gallery-images as the current user
   */
  @Get('like')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get all liked gallery-images by customer' })
  async getLikesByCustomer(@CurrentUser() currentUser: CurrentUserType) {
    const result = await this.galleryImagesLikeService.getLikesByCustomer(currentUser.userId);
    return {
      success: true,
      message: Messages.PRODUCTS_LIKES_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }
  /**
   * unLike a gallery-image as the current user
   */
  @Get('like/:galleryId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get gallery-image liked or not by customer' })
  async getGalleryImageLiked(
    @CurrentUser() currentUser: CurrentUserType,
    @Param('galleryId', ParseIntPipe) galleryId: number,
  ) {
    const result = await this.galleryImagesLikeService.getGalleryImageLiked(
      galleryId,
      currentUser.userId,
    );
    return {
      success: true,
      message: Messages.PRODUCTS_LIKE_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  /**
   * Get all gallery-images for a given Gallery and seller
   */
  @Get('all/:galleryId/:sellerId')
  @ApiOperation({ summary: 'Get gallery-images by seller and category ID' })
  @ApiParam({ name: 'galleryId', type: Number, description: 'Gallery ID' })
  @ApiParam({ name: 'sellerId', type: Number, description: 'Seller ID' })
  async findAll(
    @CurrentUser() currentUser: CurrentUserType,
    @Param('galleryId', ParseIntPipe) galleryId: number,
    @Param('sellerId', ParseIntPipe) sellerId: number,
  ) {
    const result = await this.galleryImagesService.findAllBySeller(
      sellerId,
      galleryId,
      currentUser.userId,
    );
    return {
      success: true,
      message: Messages.PRODUCTS_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  /**
   * Get a single gallery-image by its ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a gallery-image by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'GalleryImage ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.galleryImagesService.findOne(id);
    return {
      success: true,
      message: Messages.PRODUCT_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  /**
   * Update a gallery-image by ID
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update gallery-image by ID' })
  @ApiBody({
    description: 'Update gallery-image',
    required: true,
    schema: {
      type: 'object',
      properties: {
        on_sale: { type: 'boolean', example: false },
        price: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'GalleryImage updated successfully' })
  @ApiParam({ name: 'id', type: Number, description: 'GalleryImage ID' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateGalleryImageDto: UpdateGalleryImageDto,
  ) {
    const result = await this.galleryImagesService.update(id, updateGalleryImageDto);
    return {
      success: true,
      message: Messages.PRODUCT_UPDATED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  /**
   * Delete a gallery-image by ID
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete gallery-image by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'GalleryImage ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.galleryImagesService.remove(id);
    return {
      success: true,
      message: Messages.PRODUCT_DELETED,
      status: HttpStatus.OK,
      data: result,
    };
  }
  /**
   * Delete multiple gallery-image by ID
   */
  @Post('bulk-delete')
  @ApiOperation({ summary: 'Delete multiple gallery-images by IDs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of GalleryImage IDs to delete',
        },
      },
    },
  })
  async bulkDelete(@Body('ids') ids: number[]) {
    const result = await this.galleryImagesService.removeMany(ids);
    return {
      success: true,
      message: Messages.PRODUCT_DELETED,
      status: HttpStatus.OK,
      data: result,
    };
  }
}
