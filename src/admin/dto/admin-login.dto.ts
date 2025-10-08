import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin username',
    example: 'admin',
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'admin123',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}

