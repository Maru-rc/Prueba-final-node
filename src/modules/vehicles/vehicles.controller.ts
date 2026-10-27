import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehículos')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un vehículo (ADMIN)' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Listar vehículos, opcionalmente por estado' })
  findAll(@Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(query.status);
  }

  @Get('plate/:plate')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Consultar un vehículo por placa' })
  findByPlate(@Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Consultar un vehículo por id' })
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar la información de un vehículo (ADMIN)' })
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Inactivar un vehículo: eliminación lógica que conserva el historial (ADMIN)',
  })
  deactivate(@Param('id', ParseIdPipe) id: number) {
    return this.vehiclesService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reactivar un vehículo inactivo (ADMIN)' })
  activate(@Param('id', ParseIdPipe) id: number) {
    return this.vehiclesService.activate(id);
  }
}
