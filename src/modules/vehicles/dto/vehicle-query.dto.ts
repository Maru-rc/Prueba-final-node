import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';
import { VehicleStatus } from '../enums/vehicle-status.enum';

export class VehicleQueryDto {
  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus, { message: msg.enum })
  status?: VehicleStatus;
}
