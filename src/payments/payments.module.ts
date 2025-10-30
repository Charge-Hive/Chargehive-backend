import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PriceService } from '../prices/price.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { WalletModule } from '../wallet/wallet.module';
import { FlowModule } from '../flow/flow.module';

@Module({
  imports: [SupabaseModule, WalletModule, FlowModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PriceService],
  exports: [PaymentsService, PriceService],
})
export class PaymentsModule {}
