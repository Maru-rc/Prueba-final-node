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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenanceQueryDto } from './dto/maintenance-query.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { MaintenancesService } from './maintenances.service';

@ApiTags('Mantenimientos')
@ApiBearerAuth()
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Crear un mantenimiento SCHEDULED con vehículo, mecánico y taller (ADMIN)',
  })
  create(@Body() dto: CreateMaintenanceDto, @CurrentUser() user: JwtPayload) {
    return this.maintenancesService.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los mantenimientos (ADMIN)' })
  findAll(@Query() query: MaintenanceQueryDto) {
    return this.maintenancesService.findAll(query);
  }

  @Get('active')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Mantenimientos activos: SCHEDULED o IN_PROGRESS (ADMIN)',
  })
  findActive() {
    return this.maintenancesService.findActive();
  }

  @Get('me')
  @Roles(Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Mantenimientos asignados al técnico autenticado, con su taller',
  })
  findMine(
    @CurrentUser('sub') userId: number,
    @Query() query: MaintenanceQueryDto,
  ) {
    return this.maintenancesService.findAssignedToUser(userId, query);
  }

  @Get('audit-logs')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Auditoría de cambios de estado de todos los mantenimientos (ADMIN)',
  })
  findAllStatusLogs() {
    return this.maintenancesService.findAllStatusLogs();
  }

  @Get('vehicle/:vehicleId')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Mantenimientos de un vehículo en cualquier estado (ADMIN)',
  })
  findByVehicle(@Param('vehicleId', ParseIdPipe) vehicleId: number) {
    return this.maintenancesService.findByVehicle(vehicleId);
  }

  @Get('vehicle/:vehicleId/history')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Historial de un vehículo: sus mantenimientos COMPLETED (ADMIN)',
  })
  getVehicleHistory(@Param('vehicleId', ParseIdPipe) vehicleId: number) {
    return this.maintenancesService.getVehicleHistory(vehicleId);
  }

  @Get('mechanic/:mechanicId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos asignados a un mecánico (ADMIN)' })
  findByMechanic(@Param('mechanicId', ParseIdPipe) mechanicId: number) {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Consultar un mantenimiento (el técnico solo los asignados a él)',
  })
  findOne(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenancesService.findOne(id, user);
  }

  @Get(':id/audit-logs')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Auditoría de cambios de estado de un mantenimiento (ADMIN)',
  })
  findStatusLogs(@Param('id', ParseIdPipe) id: number) {
    return this.maintenancesService.findStatusLogs(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary:
      'Cambiar el estado (el técnico solo los suyos). Para COMPLETED se exigen los datos de cierre',
  })
  updateStatus(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenancesService.updateStatus(id, dto, user);
  }
}
