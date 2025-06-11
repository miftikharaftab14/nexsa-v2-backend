import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InvitationService } from '../services/invitation.service';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { _200_invitation, _200_invitations, _404_invitation } from '../documentation/api.response';
import { Response } from 'express';
import { join } from 'path';

@ApiTags('Contact Invitations')
@Controller('contact-invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Get('token/:token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: Descriptions.GET_INVITATION_BY_TOKEN_SUMMARY })
  @ApiResponse(_200_invitation)
  @ApiResponse(_404_invitation)
  async getInvitationByToken(@Param('token') token: string) {
    return this.invitationService.getInvitationByToken(token);
  }

  @Get('new-customer')
  getPage(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', '..', '..', 'public', 'invite.html'));
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: Descriptions.GET_INVITATION_BY_ID_SUMMARY })
  @ApiResponse(_200_invitation)
  @ApiResponse(_404_invitation)
  async getInvitationById(@Param('id') id: string) {
    return this.invitationService.getInvitationById(BigInt(+id));
  }

  @Get('contact/:contactId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: Descriptions.GET_INVITATIONS_BY_CONTACT_SUMMARY })
  @ApiResponse(_200_invitations)
  @ApiResponse(_404_invitation)
  async getInvitationsByContactId(@Param('contactId') contactId: string) {
    return this.invitationService.getInvitationsByContactId(+contactId);
  }

  @Get('user/:phoneNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: Descriptions.GET_INVITATIONS_BY_USERS_PHONE_NUMBER })
  @ApiResponse(_200_invitations)
  @ApiResponse(_404_invitation)
  async getInvitationsByUsersPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    return this.invitationService.getInvitationByNumber(phoneNumber);
  }
}
