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

@ApiTags('chats') // Swagger group
@ApiBearerAuth() // Apply JWT auth header globally
@Controller('chats')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes with auth guards
@ApiBearerAuth('JWT-auth') // Swagger JWT header name
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
    return this.chatService.createBroadcast({
      name: dto.name,
      message: dto.message,
      contactIds: dto.contactIds,
      senderId: currentUser.userId,
      media,
    });
  }

  @Get()
  @ApiOperation({ summary: 'get all chats for current user' })
  @ApiResponse({ status: 201, description: 'Chat get successfully' })
  async getAllChats(@CurrentUser() currentUser: CurrentUserType) {
    // Fetch chats by user and role
    return this.chatService.getAllChatsForCurrentUser(currentUser.userId, currentUser.role);
  }

  @Get(':contactId/messages')
  async getChatMessages(@Param('contactId') contactId: string) {
    // Implement logic to get all messages for a chat
    return this.chatService.getConversation(BigInt(contactId));
  }

  @Delete(':contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChat(@Param('contactId') contactId: string) {
    // Implement logic to delete a chat
    await this.chatService.deleteChat(BigInt(contactId));
    return { success: true };
  }
}
