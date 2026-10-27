import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';

/** El estado no se edita aquí: lo cambian activate/deactivate y los mantenimientos. */
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
