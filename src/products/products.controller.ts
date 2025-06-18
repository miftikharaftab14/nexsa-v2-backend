import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 files
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
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Multiple product images',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSize.PRODUCT_IMAGE }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    images: Express.Multer.File[],
  ) {
    const result = await this.productsService.createProduct(createProductDto, images || []);
    return {
      success: true,
      message: Messages.PRODUCT_CREATED,
      status: HttpStatus.CREATED,
      data: result,
    };
  }

  @Get()
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'get products for seller' })
  async findAll() {
    const result = await this.productsService.findAll();
    return {
      success: true,
      message: Messages.PRODUCTS_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productsService.findOne(id);
    return {
      success: true,
      message: Messages.PRODUCT_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  @Patch(':id')
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

  @Delete(':id')
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
