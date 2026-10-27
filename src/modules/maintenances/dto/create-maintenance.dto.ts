import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';
import { MaintenanceType } from '../enums/maintenance-type.enum';

export class CreateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  @IsEnum(MaintenanceType, { message: msg.enum })
  type: MaintenanceType;

  @ApiProperty({ example: 'Cambio de aceite y filtros' })
  @IsString({ message: msg.string })
  @IsNotEmpty({ message: msg.required })
  @MaxLength(500, { message: msg.maxLength })
  description: string;

  @ApiProperty({
    example: 46000,
    description:
      'Kilometraje al ingresar; no puede ser inferior al actual del vehículo',
  })
  @IsInt({ message: msg.int })
  @Min(0, { message: msg.min })
  mileage: number;

  @ApiProperty({
    example: '2026-10-28T07:30:00-05:00',
    description: 'Fecha y hora programada de inicio (ISO 8601)',
  })
  @IsDateString({ strict: true }, { message: msg.date })
  scheduledAt: string;

  @ApiProperty({
    example: '2026-10-28T09:00:00-05:00',
    description:
      'Fecha y hora estimada de fin; define la franja ocupada del mecánico',
  })
  @IsDateString({ strict: true }, { message: msg.date })
  estimatedEndAt: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: msg.int })
  @IsPositive({ message: msg.positive })
  vehicleId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: msg.int })
  @IsPositive({ message: msg.positive })
  mechanicId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: msg.int })
  @IsPositive({ message: msg.positive })
  workshopId: number;
}
