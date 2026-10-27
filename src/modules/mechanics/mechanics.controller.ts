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
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { MechanicQueryDto } from './dto/mechanic-query.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { MechanicsService } from './mechanics.service';

@ApiTags('Mecánicos')
@ApiBearerAuth()
@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un mecánico (ADMIN)' })
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Listar mecánicos, opcionalmente por estado (ADMIN)',
  })
  findAll(@Query() query: MechanicQueryDto) {
    return this.mechanicsService.findAll(query.isActive);
  }

  @Get('me')
  @Roles(Role.TECHNICIAN)
  @ApiOperation({ summary: 'Perfil de mecánico del técnico autenticado' })
  findMyProfile(@CurrentUser('sub') userId: number) {
    return this.mechanicsService.findByUserId(userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Consultar un mecánico (ADMIN)' })
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un mecánico (ADMIN)' })
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateMechanicDto) {
    return this.mechanicsService.update(id, dto);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar un mecánico (ADMIN)' })
  activate(@Param('id', ParseIdPipe) id: number) {
    return this.mechanicsService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Inactivar un mecánico; conserva su historial (ADMIN)',
  })
  deactivate(@Param('id', ParseIdPipe) id: number) {
    return this.mechanicsService.deactivate(id);
  }
}
