import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Sofía Herrera' })
  @IsString({ message: msg.string })
  @IsNotEmpty({ message: msg.required })
  @MaxLength(120, { message: msg.maxLength })
  name: string;

  @ApiProperty({ example: 'sofia.herrera@fleetcore.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: msg.email })
  @MaxLength(150, { message: msg.maxLength })
  email: string;

  @ApiProperty({ example: 'Motor y transmisión' })
  @IsString({ message: msg.string })
  @IsNotEmpty({ message: msg.required })
  @MaxLength(80, { message: msg.maxLength })
  specialty: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Id de un usuario TECHNICIAN para vincularlo al mecánico',
  })
  @IsOptional()
  @IsInt({ message: msg.int })
  @IsPositive({ message: msg.positive })
  userId?: number;
}
