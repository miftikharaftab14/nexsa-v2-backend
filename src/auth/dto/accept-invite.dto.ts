import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { Descriptions } from "src/common/enums/descriptions.enum";
import { Examples } from "src/common/enums/examples.enum";
import { IsUSPhoneNumber } from "src/common/validators/phone-number.validator";

export class AcceptInviteDto {
    @ApiProperty({
        description: Descriptions.PHONE_DESC,
        example: Examples.PHONE,
        required: true,
    })
    @IsNotEmpty()
    @IsUSPhoneNumber({
        message: Descriptions.PHONE_FORMAT_DESC,
    })
    phone_number: string;

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
}