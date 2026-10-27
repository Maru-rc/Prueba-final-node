import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';
import { MaintenanceStatus } from '../enums/maintenance-status.enum';
import { MaintenanceType } from '../enums/maintenance-type.enum';

export class MaintenanceQueryDto {
  @ApiPropertyOptional({ enum: MaintenanceStatus })
  @IsOptional()
  @IsEnum(MaintenanceStatus, { message: msg.enum })
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ enum: MaintenanceType })
  @IsOptional()
  @IsEnum(MaintenanceType, { message: msg.enum })
  type?: MaintenanceType;
}
