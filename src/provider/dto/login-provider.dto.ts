import { IsEmail, IsString } from 'class-validator';

export class LoginProviderDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
