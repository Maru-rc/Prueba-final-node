import { BadRequestException, ParseIntPipe } from '@nestjs/common';

/** Valida que un parámetro de ruta (id, vehicleId, ...) sea un número entero. */
export const ParseIdPipe = new ParseIntPipe({
  exceptionFactory: () =>
    new BadRequestException('El identificador debe ser un número entero'),
});
