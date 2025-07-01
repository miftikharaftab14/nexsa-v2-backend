import { IsOptional } from 'class-validator';

export class UpdateGalleryImageDto {
  @IsOptional()
  price: number;
  @IsOptional()
  on_sale: boolean;
}
