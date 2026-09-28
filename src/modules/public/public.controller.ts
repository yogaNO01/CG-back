import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumberString, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PublicService } from './public.service';

class PageQuery {
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) pageSize?: number;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsIn(['comprehensive', 'price_asc', 'popularity', 'delivery_speed']) sort?: string;
  @IsOptional() @IsString() scene?: string;
  @IsOptional() @IsString() supplyMethod?: string;
  @IsOptional() @IsIn(['platform', 'factory']) verification?: string;
  @IsOptional() priceMin?: number;
  @IsOptional() priceMax?: number;
}
class CreateProcurementDemandDto {
  @IsString() categoryId!: string;
  @IsString() @MaxLength(1000) description!: string;
  @IsNumberString() quantity!: string;
  @IsString() @MaxLength(20) unit!: string;
  @IsString() @MaxLength(80) contactName!: string;
  @IsString() @MaxLength(32) contactPhone!: string;
}

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly pub: PublicService) {}
  @Get('categories') categories() { return this.pub.categories(); }
  @Get('home') home() { return this.pub.home(); }
  @Get('products') products(@Query() query: PageQuery) { return this.pub.products(query); }
  @Get('products/:id') product(@Param('id') id: string) { return this.pub.product(id); }
  @Get('companies') companies(@Query() query: PageQuery) { return this.pub.companies(query); }
  @Get('companies/:id') company(@Param('id') id: string) { return this.pub.company(id); }
  @Get('companies/:id/products') companyProducts(@Param('id') id: string, @Query() query: PageQuery) { return this.pub.companyProducts(id, query); }
  @Get('news') news(@Query() query: PageQuery) { return this.pub.news(query); }
  @Get('news/:id') newsArticle(@Param('id') id: string) { return this.pub.newsArticle(id); }
  @Post('procurement-demands') procurementDemand(@Body() dto: CreateProcurementDemandDto) { return this.pub.createProcurementDemand(dto); }
}
