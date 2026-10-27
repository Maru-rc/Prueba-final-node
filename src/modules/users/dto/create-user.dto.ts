import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';
import { RegisterDto } from '../../auth/dto/register.dto';

/** Lo usa el ADMIN para crear usuarios con cualquier rol. */
export class CreateUserDto extends RegisterDto {
  @ApiProperty({ enum: Role, example: Role.TECHNICIAN })
  @IsEnum(Role, { message: msg.enum })
  role: Role;
}
