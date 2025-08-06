import { IsNumber } from 'class-validator';

export class ProductChatInitiateDto {
  @IsNumber()
  contactId: number;

  @IsNumber()
  productId: number;
}
