/**
 * Mensajes de validación en español para class-validator.
 * $property, $constraint1 y $constraint2 los reemplaza class-validator.
 */
export const ValidationMessages = {
  required: '$property es obligatorio',
  string: '$property debe ser un texto',
  int: '$property debe ser un número entero',
  number: '$property debe ser un número',
  positive: '$property debe ser un número positivo',
  min: '$property debe ser mayor o igual a $constraint1',
  max: '$property debe ser menor o igual a $constraint1',
  minLength: '$property debe tener al menos $constraint1 caracteres',
  maxLength: '$property debe tener como máximo $constraint1 caracteres',
  email: '$property debe ser un email válido',
  enum: '$property debe ser uno de: $constraint2',
  date: '$property debe ser una fecha en formato ISO 8601 (ej. 2026-10-27T07:30:00-05:00)',
  boolean: '$property debe ser true o false',
} as const;
