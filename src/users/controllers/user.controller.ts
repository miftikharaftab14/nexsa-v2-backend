import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponse as CustomApiResponse } from '../../common/interfaces/api-response.interface';
import { User } from '../entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User has been successfully created',
    schema: {
      example: {
        success: true,
        message: 'User created successfully',
        data: {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          phone_number: '+1234567890',
          role: 'CUSTOMER',
          profile_picture: null,
          about_me: null,
          is_deleted: false,
          created_at: '2024-03-10T12:00:00Z',
          updated_at: '2024-03-10T12:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<CustomApiResponse<User>> {
    const user = await this.userService.create(createUserDto);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all users',
    schema: {
      example: {
        success: true,
        message: 'Users retrieved successfully',
        data: [
          {
            id: 1,
            username: 'john_doe',
            email: 'john@example.com',
            phone_number: '+1234567890',
            role: 'CUSTOMER',
            profile_picture: null,
            about_me: null,
            is_deleted: false,
            created_at: '2024-03-10T12:00:00Z',
            updated_at: '2024-03-10T12:00:00Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async findAll(): Promise<CustomApiResponse<User[]>> {
    const users = await this.userService.findAll();
    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found',
    schema: {
      example: {
        success: true,
        message: 'User retrieved successfully',
        data: {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          phone_number: '+1234567890',
          role: 'CUSTOMER',
          profile_picture: null,
          about_me: null,
          is_deleted: false,
          created_at: '2024-03-10T12:00:00Z',
          updated_at: '2024-03-10T12:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async findOne(@Param('id') id: string): Promise<CustomApiResponse<User>> {
    const user = await this.userService.findOne(+id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been successfully updated',
    schema: {
      example: {
        success: true,
        message: 'User updated successfully',
        data: {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          phone_number: '+1234567890',
          role: 'CUSTOMER',
          profile_picture: null,
          about_me: null,
          is_deleted: false,
          created_at: '2024-03-10T12:00:00Z',
          updated_at: '2024-03-10T12:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<CustomApiResponse<User>> {
    const user = await this.userService.update(+id, updateUserDto);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been successfully deleted',
    schema: {
      example: {
        success: true,
        message: 'User deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async delete(@Param('id') id: string): Promise<CustomApiResponse<null>> {
    await this.userService.delete(+id);
    return {
      success: true,
      message: 'User deleted successfully',
      data: null,
    };
  }
}
