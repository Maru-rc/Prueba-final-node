/**
 * Convierte "true"/"false" de un query string a boolean.
 * Uso: @Transform(toBoolean) junto con @IsBoolean().
 */
export const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};
