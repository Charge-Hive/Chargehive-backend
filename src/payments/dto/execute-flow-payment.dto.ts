import { IsUUID, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ExecuteFlowPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsOptional()
  transactionHash?: string;

  @IsString()
  @IsNotEmpty()
  senderWalletAddress: string;
}
