import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  public chargehiveClient: SupabaseClient;
  public chargehiveAuthClient: SupabaseClient;
  // Keep old names for backward compatibility (point to same clients)
  public providerClient: SupabaseClient;
  public userClient: SupabaseClient;
  public providerAuthClient: SupabaseClient;
  public userAuthClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const chargehiveUrl = this.configService.get('CHARGEHIVE_SUPABASE_URL');
    const chargehiveAnonKey = this.configService.get('CHARGEHIVE_SUPABASE_ANON_KEY');
    const chargehiveServiceKey = this.configService.get('CHARGEHIVE_SUPABASE_SERVICE_ROLE_KEY');

    // Debug logging
    this.logger.log('🔧 Initializing Supabase clients...');
    this.logger.log(`ChargeHive URL: ${chargehiveUrl}`);
    this.logger.log(`Anon Key present: ${!!chargehiveAnonKey}`);
    this.logger.log(`Service Key present: ${!!chargehiveServiceKey}`);

    // Initialize ChargeHive Supabase Client (for database operations with service role)
    this.chargehiveClient = createClient(chargehiveUrl, chargehiveServiceKey);

    // Initialize ChargeHive Auth Client (for authentication with anon key)
    this.chargehiveAuthClient = createClient(chargehiveUrl, chargehiveAnonKey);

    // Backward compatibility - point old names to new clients
    this.providerClient = this.chargehiveClient;
    this.userClient = this.chargehiveClient;
    this.providerAuthClient = this.chargehiveAuthClient;
    this.userAuthClient = this.chargehiveAuthClient;
  }

  async onModuleInit() {
    await this.testConnections();
  }

  private async testConnections() {
    this.logger.log('🔍 Testing ChargeHive Database Connection...\n');

    // Test Providers table
    const { error: providerError } = await this.chargehiveClient
      .from('providers')
      .select('count', { count: 'exact', head: true });

    if (providerError) {
      this.logger.error(`❌ Providers Table Connection Failed: ${providerError.message}`);
    } else {
      this.logger.log('✅ Providers Table Connected');
    }

    // Test Users table
    const { error: userError } = await this.chargehiveClient
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (userError) {
      this.logger.error(`❌ Users Table Connection Failed: ${userError.message}`);
    } else {
      this.logger.log('✅ Users Table Connected');
    }

    // Test Services table
    const { error: servicesError } = await this.chargehiveClient
      .from('services')
      .select('count', { count: 'exact', head: true });

    if (servicesError) {
      this.logger.error(`❌ Services Table Connection Failed: ${servicesError.message}`);
    } else {
      this.logger.log('✅ Services Table Connected');
    }

    if (providerError || userError || servicesError) {
      this.logger.error('\n⚠️  Database connection issues detected!');
      this.logger.error('Check your .env file for correct Supabase credentials.\n');
    } else {
      this.logger.log('\n✅ All ChargeHive Tables Connected Successfully!\n');
    }
  }

  getProviderClient(): SupabaseClient {
    return this.providerClient;
  }

  getUserClient(): SupabaseClient {
    return this.userClient;
  }

  getProviderAuthClient(): SupabaseClient {
    return this.providerAuthClient;
  }

  getUserAuthClient(): SupabaseClient {
    return this.userAuthClient;
  }
}
