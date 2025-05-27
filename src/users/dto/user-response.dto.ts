import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Examples } from 'src/common/enums/examples.enum';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: Examples.USER_ID,
  })
  id: number;

  @ApiProperty({
    description: 'Username',
    example: Examples.USERNAME,
    required: false,
  })
  username?: string;

  @ApiProperty({
    description: 'Email address',
    example: Examples.EMAIL,
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Phone number',
    example: Examples.PHONE,
    required: true,
  })
  phone_number: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Profile picture ID',
    example: Examples.FILE_ID,
    required: false,
  })
  profile_picture?: string;

  @ApiProperty({
    description: 'Profile picture URL (presigned)',
    example: Examples.PRESIGNED_URL,
    required: false,
  })
  profile_picture_url?: string;

  @ApiProperty({
    description: 'About me text',
    example: Examples.ABOUT_ME,
    required: false,
  })
  about_me?: string;

  @ApiProperty({
    description: 'User link',
    example: Examples.LINK,
    required: false,
  })
  link?: string;

  @ApiProperty({
    description: 'User preferences',
    example: Examples.PREFERENCES,
    required: false,
    type: [String],
  })
  preferences?: string[];

  @ApiProperty({
    description: 'Whether the user is deleted',
    example: false,
    required: false,
  })
  is_deleted?: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: Examples.CREATED_AT,
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: Examples.UPDATED_AT,
  })
  updated_at: Date;
}
