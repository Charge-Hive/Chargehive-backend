import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumberString, Matches } from 'class-validator';

export enum ServiceType {
  PARKING = 'parking',
  CHARGER = 'charger',
}

export class AddServiceDto {
  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;

  @IsOptional()
  @IsString()
  status?: string;

  // Mandatory address fields
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  // Optional location coordinates
  @IsOptional()
  @IsNumberString()
  @Matches(/^-?([1-8]?[0-9]\.{1}\d{1,8}|90\.{1}0{1,8})$/, {
    message: 'Invalid latitude format',
  })
  latitude?: string;

  @IsOptional()
  @IsNumberString()
  @Matches(/^-?((1[0-7][0-9]|[1-9]?[0-9])\.{1}\d{1,8}|180\.{1}0{1,8})$/, {
    message: 'Invalid longitude format',
  })
  longitude?: string;

  // Optional images
  @IsOptional()
  @IsString()
  image1?: string;

  @IsOptional()
  @IsString()
  image2?: string;

  @IsOptional()
  @IsString()
  image3?: string;

  // Optional metadata
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumberString()
  hourlyRate?: string;
}
