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
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Messages } from 'src/common/enums/messages.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { CurrentUserType } from 'src/common/types/current-user.interface';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);
    return {
      success: true,
      message: Messages.CATEGORY_CREATED,
      status: HttpStatus.CREATED,
      data: category,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories by user id' })
  @ApiResponse({ status: 200, description: 'Return all categories' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: CurrentUserType) {
    const id = user?.id;

    const categories = await this.categoriesService.findAll(id);
    return {
      success: true,
      message: Messages.CATEGORIES_FETCHED,
      status: HttpStatus.OK,
      data: categories,
    };
  }
  @Get('preferences')
  @ApiOperation({ summary: 'Get all Preferences by user id' })
  @ApiResponse({ status: 200, description: 'Return all categories' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllPreferences(@CurrentUser() user: CurrentUserType) {
    const id = user?.id;
    const categories = await this.categoriesService.findAllPreferences(id);
    return {
      success: true,
      message: Messages.CATEGORIES_FETCHED,
      status: HttpStatus.OK,
      data: categories,
    };
  }
  @Get('seller/:id')
  @ApiOperation({ summary: 'Get all categories by seller id' })
  @ApiResponse({ status: 200, description: 'Return all categories' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  async findAllbySeller(@Param('id') id: number, @Query('search') search: string) {
    const categories = await this.categoriesService.findAllByUserID(id, search);
    return {
      success: true,
      message: Messages.CATEGORIES_FETCHED,
      status: HttpStatus.OK,
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  @ApiResponse({ status: 200, description: 'Return the category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.findOne(id);
    return {
      success: true,
      message: Messages.CATEGORY_FETCHED,
      status: HttpStatus.OK,
      data: category,
    };
  }

  @Patch(':id')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return {
      success: true,
      message: Messages.CATEGORY_UPDATED,
      status: HttpStatus.OK,
      data: category,
    };
  }

  @Delete(':id')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Seller access required' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.remove(id);
    return {
      success: true,
      message: Messages.CATEGORY_DELETED,
      status: HttpStatus.OK,
      data: category,
    };
  }
}
