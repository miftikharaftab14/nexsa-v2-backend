import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiBody({
    description: 'Admin login credentials',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@nexsa.com' },
        password: { type: 'string', example: 'admin123' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: AdminLoginDto) {
    const result = await this.adminService.login(loginDto.email, loginDto.password);
    return {
      success: true,
      message: 'Admin logged in successfully',
      status: HttpStatus.OK,
      data: result,
    };
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all reported images' })
  @ApiResponse({ status: 200, description: 'Reported images retrieved successfully' })
  async getReportedImages() {
    const result = await this.adminService.getReportedImages();
    return {
      success: true,
      message: 'Reported images retrieved successfully',
      status: HttpStatus.OK,
      data: result,
    };
  }

  @Delete('reports/:imageId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a reported image' })
  @ApiParam({ name: 'imageId', type: Number, description: 'Image ID to delete' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async deleteReportedImage(@Param('imageId', ParseIntPipe) imageId: number) {
    await this.adminService.deleteReportedImage(imageId);
    return {
      success: true,
      message: 'Image deleted successfully',
      status: HttpStatus.OK,
      data: null,
    };
  }
}

