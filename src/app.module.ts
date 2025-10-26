import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { ProviderModule } from './provider/provider.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { SessionsModule } from './sessions/sessions.module';
import { ServicesModule } from './services/services.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    AuthModule,
    ProviderModule,
    UserModule,
    WalletModule,
    SessionsModule,
    ServicesModule,
    PaymentsModule,
  ],
})
export class AppModule {}
