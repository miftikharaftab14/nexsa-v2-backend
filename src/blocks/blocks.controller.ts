import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CurrentUserType } from '../common/types/current-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('blocks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  @ApiOperation({ summary: 'Block a user (customer or seller)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 123 },
        reason: { type: 'string', example: 'Spam or inappropriate content', nullable: true },
      },
      required: ['userId'],
    },
  })
  async block(
    @CurrentUser() currentUser: CurrentUserType,
    @Body('userId') userId: number,
    @Body('reason') reason?: string,
  ) {
    const result = await this.blocksService.block(currentUser.userId, userId, reason);
    return { success: true, status: HttpStatus.CREATED, data: result };
  }

  @Put('unblock/:userId')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblock(
    @CurrentUser() currentUser: CurrentUserType,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    await this.blocksService.unblock(currentUser.userId, userId);
    return { success: true, status: HttpStatus.OK };
  }

  @Get('blocked-list')
  @ApiOperation({ summary: 'List users blocked by the current user' })
  async list(@CurrentUser() currentUser: CurrentUserType) {
    const list = await this.blocksService.listBlockedBy(currentUser.userId);
    return { success: true, status: HttpStatus.OK, data: list };
  }
}


