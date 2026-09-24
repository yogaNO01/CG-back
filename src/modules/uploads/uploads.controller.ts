import { Controller, Delete, Get, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import { UploadsService } from './uploads.service';
@ApiTags('uploads') @Controller('uploads') export class UploadsController { constructor(private readonly uploads: UploadsService, private readonly config: ConfigService) {} @Post() @ApiBearerAuth() @UseGuards(JwtAccessGuard) @ApiConsumes('multipart/form-data') @UseInterceptors(FileInterceptor('file')) upload(@UploadedFile() file: any) { return this.uploads.save(file); } @Delete(':filename') @ApiBearerAuth() @UseGuards(JwtAccessGuard) remove(@Param('filename') filename: string) { return this.uploads.remove(filename); } @Get(':filename') file(@Param('filename') filename: string, @Res() response: any) { if (!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]{1,10}$/.test(filename)) return response.status(400).end(); const directory = this.config.get('UPLOAD_LOCAL_DIR') ?? join(process.cwd(), 'uploads'); return createReadStream(join(directory, filename)).on('error', () => response.status(404).end()).pipe(response); } }
