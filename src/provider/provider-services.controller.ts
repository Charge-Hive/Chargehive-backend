import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProviderServicesService } from './provider-services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProviderGuard } from '../auth/guards/provider.guard';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Controller('provider/services')
@UseGuards(JwtAuthGuard, ProviderGuard)
export class ProviderServicesController {
  constructor(private providerServicesService: ProviderServicesService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image1', maxCount: 1 },
      { name: 'image2', maxCount: 1 },
    ]),
  )
  async createService(
    @Request() req,
    @Body('provider_type') providerType: string,
    @Body('latitude') latitude: string,
    @Body('longitude') longitude: string,
    @UploadedFiles() files: { image1?: MulterFile[]; image2?: MulterFile[] },
  ) {
    const service = await this.providerServicesService.createService(
      req.user.id,
      providerType,
      parseFloat(latitude),
      parseFloat(longitude),
      files.image1?.[0],
      files.image2?.[0],
    );

    return {
      success: true,
      message: 'Service created successfully',
      data: service,
    };
  }

  @Get()
  async getServices(@Request() req) {
    const services = await this.providerServicesService.getServices(req.user.id);

    return {
      success: true,
      data: services,
    };
  }
}
