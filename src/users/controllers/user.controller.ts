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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponse as CustomApiResponse } from '../../common/interfaces/api-response.interface';
import { User } from '../entities/user.entity';
import { Messages } from '../../common/enums/messages.enum';
import { Descriptions } from '../../common/enums/descriptions.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSize } from 'src/common/constants/file';
import {
  _200_user_delete,
  _200_users,
  _201_users,
  _400_users,
  _401_users,
  _403_users,
  _404_users,
  _200_profile_picture,
  _400_profile_picture,
  _404_profile_picture,
} from '../documentaion/api.response';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: Descriptions.CREATE_USER_SUMMARY })
  @ApiResponse(_201_users)
  @ApiResponse(_400_users)
  @ApiResponse(_401_users)
  @ApiResponse(_403_users)
  async create(@Body() createUserDto: CreateUserDto): Promise<CustomApiResponse<User>> {
    const user = await this.userService.create(createUserDto);
    return {
      success: true,
      message: Messages.USER_CREATED,
      status: HttpStatus.CREATED,
      data: user,
    };
  }

  @Get(':id/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Update user profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file (image)',
        },
        folder: {
          type: 'string',
          description: 'Optional folder path where the image should be stored',
          example: 'profile-pictures',
        },
      },
    },
  })
  @ApiResponse(_200_profile_picture)
  @ApiResponse(_400_profile_picture)
  @ApiResponse(_404_profile_picture)
  async updateProfilePicture(@Param('id') id: number): Promise<CustomApiResponse<string | null>> {
    const result = await this.userService.getProfilePictureUrl(id);
    return {
      success: true,
      message: 'Profile picture updated successfully',
      status: HttpStatus.OK,
      data: result,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: Descriptions.GET_ALL_USERS_SUMMARY })
  @ApiResponse(_200_users)
  @ApiResponse(_401_users)
  @ApiResponse(_403_users)
  async findAll(): Promise<CustomApiResponse<User[]>> {
    const users = await this.userService.findAll();
    return {
      success: true,
      message: Messages.USERS_FETCHED,
      status: HttpStatus.OK,
      data: users,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: Descriptions.GET_USER_BY_ID_SUMMARY })
  @ApiResponse(_200_users)
  @ApiResponse(_404_users)
  @ApiResponse(_401_users)
  @ApiResponse(_403_users)
  async findOne(@Param('id') id: string): Promise<CustomApiResponse<User>> {
    const user = await this.userService.findOne(+id);
    if (!user) {
      throw new NotFoundException(Messages.USER_NOT_FOUND);
    }
    return {
      success: true,
      message: Messages.USER_FETCHED,
      status: HttpStatus.OK,
      data: user,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: Descriptions.UPDATE_USER_SUMMARY })
  @ApiResponse(_200_users)
  @ApiResponse(_404_users)
  @ApiResponse(_400_users)
  @ApiResponse(_401_users)
  @ApiResponse(_403_users)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSize.PROFILE_IMAGE_SIZE }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ): Promise<CustomApiResponse<User>> {
    const user = await this.userService.update(+id, { ...updateUserDto, image: file });
    if (!user) {
      throw new NotFoundException(Messages.USER_NOT_FOUND);
    }
    return {
      success: true,
      message: Messages.USER_UPDATED,
      status: HttpStatus.OK,
      data: user,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: Descriptions.DELETE_USER_SUMMARY })
  @ApiResponse(_200_user_delete)
  @ApiResponse(_404_users)
  @ApiResponse(_401_users)
  @ApiResponse(_403_users)
  async delete(@Param('id') id: string): Promise<CustomApiResponse<null>> {
    await this.userService.delete(+id);
    return {
      success: true,
      message: Messages.USER_DELETED,
      status: HttpStatus.OK,
      data: null,
    };
  }
}
