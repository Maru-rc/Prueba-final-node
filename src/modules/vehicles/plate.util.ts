/** Las placas se guardan en mayúsculas y sin espacios: " abc 123" -> "ABC123". */
export const normalizePlate = (plate: string): string =>
  plate.replace(/\s+/g, '').toUpperCase();
