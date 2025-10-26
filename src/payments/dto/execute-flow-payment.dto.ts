import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

export class ExecuteFlowPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  transactionHash: string;

  @IsString()
  @IsNotEmpty()
  senderWalletAddress: string;
}
