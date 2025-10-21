import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class SendTokensDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{16}$/, {
    message: 'Invalid Flow address format. Must be 0x followed by 16 hex characters',
  })
  toAddress: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,8})?$/, {
    message: 'Invalid amount format. Must be a valid number with up to 8 decimal places',
  })
  amount: string;
}
