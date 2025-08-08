import { IsNumber, IsString } from 'class-validator';

export class ProductChatInitiateDto {
  @IsNumber()
  sellerId: number;

  @IsNumber()
  productId: number;

  @IsString()
  content: string;

  @IsString()
  messageType: string;
}
