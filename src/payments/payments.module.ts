import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PriceService } from '../prices/price.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [SupabaseModule, WalletModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PriceService],
  exports: [PaymentsService, PriceService],
})
export class PaymentsModule {}
