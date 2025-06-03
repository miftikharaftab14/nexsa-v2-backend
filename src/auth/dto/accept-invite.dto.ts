import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { InvitationStatus } from "src/common/enums/contact-invitation.enum";
import { Descriptions } from "src/common/enums/descriptions.enum";
import { Examples } from "src/common/enums/examples.enum";
import { IsUSPhoneNumber } from "src/common/validators/phone-number.validator";

export class AcceptInviteDto {

    @ApiProperty({
        description: Descriptions.INVITATION_ID_DESC,
        example: Examples.INVITATION_ID,
        required: true,
    })
    @IsNotEmpty()
    invite_id: bigint;

    @ApiProperty({
        description: Descriptions.USER_ID_DESC,
        example: Examples.USER_ID,
        required: true,
    })
    @IsNotEmpty()
    user_id: bigint;

    @ApiProperty({
        description: Descriptions.INVITATION_STATUS_DESC,
        example: Examples.INVITATION_STATUS,
        enum: InvitationStatus,          // <-- OpenAPI will show the enum values
        required: true,
    })

    @IsNotEmpty()
    @IsEnum(InvitationStatus)          // <-- Marks the field as whitelisted + validates
    invitation_status: InvitationStatus;
}