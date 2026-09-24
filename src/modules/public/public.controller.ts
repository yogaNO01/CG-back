import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PublicService } from './public.service';

class PageQuery {
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) pageSize?: number;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsIn(['comprehensive', 'price_asc', 'popularity']) sort?: string;
}

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly pub: PublicService) {}
  @Get('categories') categories() { return this.pub.categories(); }
  @Get('products') products(@Query() query: PageQuery) { return this.pub.products(query); }
  @Get('products/:id') product(@Param('id') id: string) { return this.pub.product(id); }
  @Get('companies') companies(@Query() query: PageQuery) { return this.pub.companies(query); }
  @Get('companies/:id') company(@Param('id') id: string) { return this.pub.company(id); }
  @Get('companies/:id/products') companyProducts(@Param('id') id: string, @Query() query: PageQuery) { return this.pub.companyProducts(id, query); }
}
