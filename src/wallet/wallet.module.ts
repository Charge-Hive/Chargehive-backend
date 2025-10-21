import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { FlowModule } from '../flow/flow.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, FlowModule, AuthModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
