import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { FileSize } from 'src/common/constants/file';
import { Messages } from 'src/common/enums/messages.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUserType } from 'src/common/types/current-user.interface';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ProductLikeService } from './products-like.service';

@ApiTags('products') // Swagger group
@ApiBearerAuth() // Apply JWT auth header globally
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes with auth guards
@ApiBearerAuth('JWT-auth') // Swagger JWT header name
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productsLikeService: ProductLikeService,
  ) {}

  /**
   * Create a new product with optional images
   * Only accessible by SELLER roles
   */
  @Post()
  @Roles(UserRole.SELLER)
  @UseInterceptors(FilesInterceptor('images', 10)) // Accept up to 10 image files
  @ApiOperation({ summary: 'Create product with multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Nike Air Max' },
        description: { type: 'string', example: 'Stylish and comfortable running shoes' },
        categoryId: { type: 'number', example: 1 },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Multiple product images',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() currentUser: CurrentUserType,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSize.PRODUCT_IMAGE }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    images: Express.Multer.File[],
  ) {
    const result = await this.productsService.createProduct(
      createProductDto,
      images || [],
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
   * Like a product as the current user
   */
  @Post('like/:productId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Like a product by its ID' })
  @ApiParam({ name: 'productId', type: Number, description: 'Product ID that you want to like' })
  async likeProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    const result = await this.productsLikeService.likeProduct(productId, currentUser.userId);
    return {
      success: true,
      message: Messages.PRODUCTS_LIKED,
      status: HttpStatus.OK,
      data: result,
    };
  }
  /**
   * Unlike a product as the current user
   */
  @Delete('like/:productId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Unlike a product by its ID' })
  @ApiParam({ name: 'productId', type: Number, description: 'Product ID that you want to like' })
  async unlikeProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    const result = await this.productsLikeService.unlikeProduct(productId, currentUser.userId);
    return {
      success: true,
      message: Messages.PRODUCTS_UNLIKED,
      status: HttpStatus.OK,
      data: result,
    };
  }
  /**
   * get all liked products as the current user
   */
  @Get('like')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get all liked products by customer' })
  async getLikesByCustomer(@CurrentUser() currentUser: CurrentUserType) {
    const result = await this.productsLikeService.getLikesByCustomer(currentUser.userId);
    return {
      success: true,
      message: Messages.PRODUCTS_LIKES_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }
  /**
   * unLike a product as the current user
   */
  @Get('like/:productId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get product liked or not by customer' })
  async getProductLiked(
    @CurrentUser() currentUser: CurrentUserType,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const result = await this.productsLikeService.getProductLiked(productId, currentUser.userId);
    return {
      success: true,
      message: Messages.PRODUCTS_LIKE_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  /**
   * Get all products for a given category and seller
   */
  @Get('all/:categoryId/:sellerId')
  @ApiOperation({ summary: 'Get products by seller and category ID' })
  @ApiParam({ name: 'categoryId', type: Number, description: 'Category ID' })
  @ApiParam({ name: 'sellerId', type: Number, description: 'Seller ID' })
  async findAll(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('sellerId', ParseIntPipe) sellerId: number,
  ) {
    const result = await this.productsService.findAllBySeller(sellerId, categoryId);
    return {
      success: true,
      message: Messages.PRODUCTS_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  /**
   * Get a single product by its ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productsService.findOne(id);
    return {
      success: true,
      message: Messages.PRODUCT_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  /**
   * Update a product by ID
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateProductDto: {
      name?: string;
      mediaUrls?: string[];
      categoryId?: number;
    },
  ) {
    const result = await this.productsService.update(id, updateProductDto);
    return {
      success: true,
      message: Messages.PRODUCT_UPDATED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  /**
   * Delete a product by ID
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productsService.remove(id);
    return {
      success: true,
      message: Messages.PRODUCT_DELETED,
      status: HttpStatus.OK,
      data: result,
    };
  }
}
