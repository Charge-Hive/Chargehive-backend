import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { FlowModule } from '../flow/flow.module';

@Module({
  imports: [SupabaseModule, FlowModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
