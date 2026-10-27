import { PartialType } from '@nestjs/swagger';
import { CreateWorkshopDto } from './create-workshop.dto';

/** El estado no se edita aquí: se usa activate/deactivate. */
export class UpdateWorkshopDto extends PartialType(CreateWorkshopDto) {}
