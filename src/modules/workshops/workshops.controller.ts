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
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { WorkshopQueryDto } from './dto/workshop-query.dto';
import { WorkshopsService } from './workshops.service';

@ApiTags('Talleres')
@ApiBearerAuth()
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un taller (ADMIN)' })
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Listar talleres activos' })
  findAll(@Query() query: WorkshopQueryDto) {
    return this.workshopsService.findAll(query.includeInactive);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Consultar un taller' })
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un taller (ADMIN)' })
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateWorkshopDto) {
    return this.workshopsService.update(id, dto);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar un taller (ADMIN)' })
  activate(@Param('id', ParseIdPipe) id: number) {
    return this.workshopsService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Inactivar un taller (ADMIN)' })
  deactivate(@Param('id', ParseIdPipe) id: number) {
    return this.workshopsService.deactivate(id);
  }
}
