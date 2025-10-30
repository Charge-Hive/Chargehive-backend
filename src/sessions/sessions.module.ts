import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { FlowModule } from '../flow/flow.module';

@Module({
  imports: [SupabaseModule, FlowModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
