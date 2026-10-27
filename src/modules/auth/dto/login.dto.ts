import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';

export class LoginDto {
  @ApiProperty({ example: 'admin@fleetcore.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: msg.email })
  email: string;

  @ApiProperty({ example: 'Admin123*' })
  @IsString({ message: msg.string })
  @IsNotEmpty({ message: msg.required })
  password: string;
}
