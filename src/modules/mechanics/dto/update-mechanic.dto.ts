import { PartialType } from '@nestjs/swagger';
import { CreateMechanicDto } from './create-mechanic.dto';

/** El estado no se edita aquí: se usa activate/deactivate. */
export class UpdateMechanicDto extends PartialType(CreateMechanicDto) {}
