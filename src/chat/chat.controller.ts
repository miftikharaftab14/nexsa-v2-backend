import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { CurrentUserType } from 'src/common/types/current-user.interface';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileSize } from 'src/common/constants/file';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Messages } from 'src/common/enums/messages.enum';

@ApiTags('chats') // Swagger group
@ApiBearerAuth() // Apply JWT auth header globally
@Controller('chats')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes with auth guards
@ApiBearerAuth('JWT-auth') // Swagger JWT header name
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'get all chats for current user' })
  @ApiResponse({ status: 201, description: 'Chat get successfully' })
  async getAllChats(@CurrentUser() currentUser: CurrentUserType) {
    // Fetch chats by user and role
    const result = await this.chatService.getAllChatsForCurrentUser(currentUser.userId);
    return {
      success: true,
      message: Messages.CHATS_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  @Get(':contactId/messages')
  async getChatMessages(@Param('contactId') contactId: string) {
    // Implement logic to get all messages for a chat
    const result = await this.chatService.getConversation(BigInt(contactId));
    return {
      success: true,
      message: Messages.CHAT_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  @Delete(':contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChat(@Param('contactId') contactId: string) {
    // Implement logic to delete a chat
    await this.chatService.deleteChat(BigInt(contactId));
    return {
      success: true,
      message: Messages.CHAT_DELETED,
      status: HttpStatus.OK,
      data: contactId,
    };
  }
  @Post('broadcast')
  @UseInterceptors(FilesInterceptor('media', 10))
  @ApiOperation({ summary: 'Create broadcast with message and optional media' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Promo Customers' },
        message: { type: 'string', example: 'Special offer for you!' },
        media: { type: 'string', format: 'binary', description: 'Optional media file' },
        contactIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'List of contact IDs',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Broadcast created successfully' })
  async createBroadcast(
    @Body() dto: CreateBroadcastDto,
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
    media: Express.Multer.File[],
  ) {
    // If media is uploaded, pass its key to the service
    const result = await this.chatService.createBroadcast({
      name: dto.name,
      message: dto.message,
      contactIds: dto.contactIds,
      senderId: currentUser.userId,
      media,
    });
    return {
      success: true,
      message: Messages.BRODCAST_CREATED,
      status: HttpStatus.CREATED,
      data: result,
    };
  }
  @Get('broadcast/by-seller')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Get all broadcasts created by a seller' })
  @ApiResponse({ status: 200, description: 'List of broadcasts' })
  async getBroadcastsBySeller(@CurrentUser() currentUser: CurrentUserType) {
    const result = await this.chatService.getBroadcastsBySeller(currentUser.userId);
    return {
      success: true,
      message: Messages.BRODCAST_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }
  @Get('broadcast/:brodcastId')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Get a broadcasts' })
  @ApiResponse({ status: 200, description: 'List of broadcasts' })
  async getBroadcastsById(@Param('brodcastId') brodcastId: number) {
    const result = await this.chatService.getBroadcastsById(brodcastId);
    return {
      success: true,
      message: Messages.BRODCAST_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }
  @Delete('broadcast/:brodcastId')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'delete a broadcasts' })
  @ApiResponse({ status: 200, description: 'Broadcasts deleted successfully' })
  async deleteBroadcastsBySeller(@Param('brodcastId') brodcastId: number) {
    const result = await this.chatService.deleteBroadcastsBySeller(brodcastId);
    return {
      success: true,
      message: Messages.BRODCAST_DELETED,
      status: HttpStatus.OK,
      data: result,
    };
  }
}
