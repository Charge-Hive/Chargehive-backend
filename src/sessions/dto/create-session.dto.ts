import { IsNotEmpty, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'ID of the service to book',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Start date and time of the session (ISO 8601 format)',
    example: '2025-10-21T10:00:00Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  fromDatetime: string;

  @ApiProperty({
    description: 'End date and time of the session (ISO 8601 format)',
    example: '2025-10-21T12:00:00Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  toDatetime: string;
}
