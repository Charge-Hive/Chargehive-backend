import { IsUUID, IsNotEmpty, IsDateString } from 'class-validator';

export class InitiateFlowPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsDateString()
  @IsNotEmpty()
  fromDatetime: string;

  @IsDateString()
  @IsNotEmpty()
  toDatetime: string;
}
