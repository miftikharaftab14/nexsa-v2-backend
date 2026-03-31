import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { InvitationStatus } from 'src/common/enums/contact-invitation.enum';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { Examples } from 'src/common/enums/examples.enum';

export class AcceptInviteDto {
  @ApiProperty({
    description: Descriptions.INVITATION_ID_DESC,
    example: Examples.INVITATION_ID,
    required: true,
  })
  @IsNotEmpty()
  invite_id: bigint;

  @ApiProperty({
    description: Descriptions.INVITATION_STATUS_DESC,
    example: Examples.INVITATION_STATUS,
    enum: InvitationStatus,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(InvitationStatus)
  invitation_status: InvitationStatus;
}