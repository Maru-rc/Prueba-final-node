import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ValidationMessages as msg } from '../../../common/validation/validation-messages';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Taller Sur' })
  @IsString({ message: msg.string })
  @IsNotEmpty({ message: msg.required })
  @MaxLength(120, { message: msg.maxLength })
  name: string;

  @ApiProperty({ example: 'Calle 10 # 52-30, Medellín' })
  @IsString({ message: msg.string })
  @IsNotEmpty({ message: msg.required })
  @MaxLength(200, { message: msg.maxLength })
  address: string;
}
