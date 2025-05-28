import { IsString, IsEmail, IsOptional, Length, IsNumber, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { Examples } from 'src/common/enums/examples.enum';
import { IsUSPhoneNumber } from 'src/common/validators/phone-number.validator';
import { ContactStatus } from 'src/common/enums/contact-status.enum';
import { Type } from 'class-transformer';

export class CreateContactDto {
  @ApiProperty({
    description: Descriptions.SELLER_ID_DESC,
    example: Examples.USER_ID,
    required: true,
  })
  @IsNumber()
  @Type(() => Number)
  seller_id: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  invited_user_id?: number;

  @ApiProperty({
    description: Descriptions.CONTACT_FULL_NAME_DESC,
    example: Examples.CONTACT_NAME,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  full_name: string;

  @ApiProperty({
    description: Descriptions.PHONE_DESC,
    example: Examples.PHONE,
    required: true,
  })
  @ValidateIf((o: CreateContactDto) => !o.email) // Only validate if email is not provided
  @IsUSPhoneNumber()
  phone_number: string;

  @ApiProperty({
    description: Descriptions.EMAIL_DESC,
    example: Examples.EMAIL,
    required: false,
  })
  @ValidateIf((o: CreateContactDto) => !o.phone_number) // Only validate if phone_number is not provided
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: Descriptions.CONTACT_STATUS_DESC,
    enum: ContactStatus,
    example: ContactStatus.NEW,
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: ContactStatus;
}
