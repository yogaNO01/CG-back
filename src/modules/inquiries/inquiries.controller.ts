import { Body, Controller, Post } from '@nestjs/common';
import { IsDateString, IsEmail, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';
import { InquiriesService } from './inquiries.service';

class CreateInquiryDto {
  @IsString() companyId!: string;
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() skuId?: string;
  @IsString() @MaxLength(300) requirement!: string;
  @IsOptional() @IsString() @MaxLength(500) expectedSpec?: string;
  @IsOptional() @IsNumberString() quantity?: string;
  @IsOptional() @IsString() @MaxLength(20) unit?: string;
  @IsOptional() @IsDateString() expectedDeliveryAt?: string;
  @IsString() @MaxLength(80) contactName!: string;
  @IsString() @MaxLength(32) contactPhone!: string;
  @IsOptional() @IsEmail() @MaxLength(120) contactEmail?: string;
}

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Post()
  create(@Body() dto: CreateInquiryDto) { return this.inquiries.create(dto); }
}
