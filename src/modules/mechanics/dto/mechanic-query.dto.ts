import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { toBoolean } from '../../../common/transformers/boolean-query.transformer';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';

export class MechanicQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por mecánicos activos o inactivos',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: msg.boolean })
  isActive?: boolean;
}
