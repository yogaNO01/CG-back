import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma.service';
@ApiTags('system')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() async check() { await this.prisma.$queryRawUnsafe('SELECT 1'); return { code:0,message:'success',data:{status:'ok'} }; }
}
