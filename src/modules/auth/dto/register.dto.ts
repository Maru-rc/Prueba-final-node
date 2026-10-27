import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';

export class RegisterDto {
  @ApiProperty({ example: 'Pedro Martínez' })
  @IsString({ message: msg.string })
  @IsNotEmpty({ message: msg.required })
  @MaxLength(120, { message: msg.maxLength })
  name: string;

  @ApiProperty({ example: 'pedro.martinez@fleetcore.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: msg.email })
  @MaxLength(150, { message: msg.maxLength })
  email: string;

  @ApiProperty({ example: 'Tecnico123*', minLength: 8 })
  @IsString({ message: msg.string })
  @MinLength(8, { message: msg.minLength })
  // bcrypt solo usa los primeros 72 bytes
  @MaxLength(72, { message: msg.maxLength })
  password: string;
}
