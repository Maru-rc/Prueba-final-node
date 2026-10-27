import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';
import { MaintenanceStatus } from '../enums/maintenance-status.enum';

export class UpdateMaintenanceStatusDto {
  @ApiProperty({
    enum: MaintenanceStatus,
    example: MaintenanceStatus.COMPLETED,
  })
  @IsEnum(MaintenanceStatus, { message: msg.enum })
  status: MaintenanceStatus;

  @ApiPropertyOptional({
    example: 'Cambio de aceite 15W-40, filtro de aceite y filtro de aire',
    description: 'Trabajo realizado. Obligatorio para COMPLETED',
  })
  @IsOptional()
  @IsString({ message: msg.string })
  @IsNotEmpty({ message: msg.required })
  @MaxLength(1000, { message: msg.maxLength })
  workPerformed?: string;

  @ApiPropertyOptional({
    example: 350000,
    description: 'Costo final. Obligatorio para COMPLETED',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: msg.number })
  @Min(0, { message: msg.min })
  finalCost?: number;

  @ApiPropertyOptional({
    example: '2026-10-28T09:10:00-05:00',
    description: 'Fecha de finalización (ISO 8601). Obligatoria para COMPLETED',
  })
  @IsOptional()
  @IsDateString({ strict: true }, { message: msg.date })
  finishedAt?: string;

  @ApiPropertyOptional({
    example: 46050,
    description: 'Kilometraje final. Obligatorio para COMPLETED',
  })
  @IsOptional()
  @IsInt({ message: msg.int })
  @Min(0, { message: msg.min })
  finalMileage?: number;

  @ApiPropertyOptional({
    example: 'El cliente solicitó reprogramar',
    description:
      'Comentario que queda en la auditoría (ej. motivo de cancelación)',
  })
  @IsOptional()
  @IsString({ message: msg.string })
  @MaxLength(300, { message: msg.maxLength })
  note?: string;
}
