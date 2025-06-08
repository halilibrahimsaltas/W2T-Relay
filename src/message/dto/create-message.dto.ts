import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ProductInfo } from '../utils/product.utils';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsOptional()
    sender?: string;

    @IsOptional()
    convertedContent?: ProductInfo;
}
