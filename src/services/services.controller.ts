import { Controller, Get } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  async getAllServices() {
    const services = await this.servicesService.getAllAvailableServices();

    return {
      success: true,
      data: services,
    };
  }
}
