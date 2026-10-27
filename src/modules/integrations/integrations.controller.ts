import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuth } from '../../common/decorators/api-key-auth.decorator';
import { MaintenancesService } from '../maintenances/maintenances.service';

/** Endpoints para sistemas externos (aliados): se autentican con x-api-key, no con JWT. */
@ApiTags('Integraciones')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Get('vehicles/:plate/maintenance-history')
  @ApiKeyAuth()
  @ApiOperation({
    summary: 'Historial de mantenimientos de un vehículo por placa (x-api-key)',
  })
  getVehicleHistory(@Param('plate') plate: string) {
    return this.maintenancesService.getVehicleHistoryByPlate(plate);
  }
}
