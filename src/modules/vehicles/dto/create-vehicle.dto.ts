import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';
import { normalizePlate } from '../plate.util';

const MIN_YEAR = 1950;
const MAX_YEAR = new Date().getFullYear() + 1;

export class CreateVehicleDto {
  @ApiProperty({
    example: 'MNO345',
    description: 'Se guarda en mayúsculas y sin espacios',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizePlate(value) : value,
  )
  @IsString({ message: msg.string })
  @Matches(/^[A-Z0-9-]{5,10}$/, {
    message:
      'plate debe tener entre 5 y 10 caracteres (letras, números o guion)',
  })
  plate: string;

  @ApiProperty({ example: 'Chevrolet' })
  @IsString({ message: msg.string })
  @IsNotEmpty({ message: msg.required })
  @MaxLength(60, { message: msg.maxLength })
  brand: string;

  @ApiProperty({ example: 'NPR' })
  @IsString({ message: msg.string })
  @IsNotEmpty({ message: msg.required })
  @MaxLength(60, { message: msg.maxLength })
  model: string;

  @ApiProperty({ example: 2021 })
  @IsInt({ message: msg.int })
  @Min(MIN_YEAR, { message: msg.min })
  @Max(MAX_YEAR, { message: msg.max })
  year: number;

  @ApiProperty({ example: 52000, description: 'Kilometraje actual en km' })
  @IsInt({ message: msg.int })
  @Min(0, { message: msg.min })
  mileage: number;
}
