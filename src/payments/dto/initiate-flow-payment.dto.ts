import { IsUUID, IsNotEmpty } from 'class-validator';

export class InitiateFlowPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;
}
