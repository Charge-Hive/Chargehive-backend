import { Module } from '@nestjs/common';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';
import { ProviderServicesController } from './provider-services.controller';
import { ProviderServicesService } from './provider-services.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { FlowModule } from '../flow/flow.module';

@Module({
  imports: [SupabaseModule, AuthModule, FlowModule],
  controllers: [ProviderController, ProviderServicesController],
  providers: [ProviderService, ProviderServicesService],
  exports: [ProviderService, ProviderServicesService],
})
export class ProviderModule {}
