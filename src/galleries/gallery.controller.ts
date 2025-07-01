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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CurrentUserType } from '../common/types/current-user.interface';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('galleries')
@ApiBearerAuth()
@Controller('galleries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post()
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Create a new gallery' })
  @ApiResponse({ status: 201, description: 'Gallery successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required' })
  async create(@Body() createGalleryDto: CreateGalleryDto, @CurrentUser() user: CurrentUserType) {
    const gallery = await this.galleryService.create(createGalleryDto, user.userId);
    return {
      success: true,
      message: 'Gallery created',
      status: HttpStatus.CREATED,
      data: gallery,
    };
  }

  @Get()
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Get all galleries for seller label and value' })
  @ApiResponse({ status: 200, description: 'Return all galleries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: CurrentUserType) {
    const galleries = await this.galleryService.findAll(user.userId);
    return {
      success: true,
      message: 'Galleries fetched',
      status: HttpStatus.OK,
      data: galleries,
    };
  }

  @Get('by-user/:id')
  @ApiOperation({ summary: 'Get gallery by user id' })
  @ApiResponse({ status: 200, description: 'Return gallery' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByUserId(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserType) {
    const gallery = await this.galleryService.findByUserId(id, user.userId);
    return {
      success: true,
      message: 'Gallery fetched',
      status: HttpStatus.OK,
      data: gallery,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a gallery by id' })
  @ApiResponse({ status: 200, description: 'Return the gallery' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Gallery not found' })
  @ApiParam({ name: 'id', type: 'number', description: 'Gallery ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const gallery = await this.galleryService.findOne(id);
    return {
      success: true,
      message: 'Gallery fetched',
      status: HttpStatus.OK,
      data: gallery,
    };
  }

  @Patch(':id')
  @Roles(UserRole.SELLER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a gallery' })
  @ApiResponse({ status: 200, description: 'Gallery successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required' })
  @ApiResponse({ status: 404, description: 'Gallery not found' })
  @ApiParam({ name: 'id', type: 'number', description: 'Gallery ID' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGalleryDto: UpdateGalleryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const gallery = await this.galleryService.update(id, updateGalleryDto, image);
    return {
      success: true,
      message: 'Gallery updated',
      status: HttpStatus.OK,
      data: gallery,
    };
  }

  @Delete(':id')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Delete a gallery' })
  @ApiResponse({ status: 200, description: 'Gallery successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required' })
  @ApiResponse({ status: 404, description: 'Gallery not found' })
  @ApiParam({ name: 'id', type: 'number', description: 'Gallery ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.galleryService.remove(id);
    return {
      success: true,
      message: 'Gallery deleted',
      status: HttpStatus.OK,
      data: null,
    };
  }
}
