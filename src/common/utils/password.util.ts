import { compare, hash } from 'bcryptjs';

const SALT_ROUNDS = 10;

/** Genera el hash bcrypt de una contraseña. Nunca se guarda la contraseña en texto plano. */
export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plainPassword, passwordHash);
}
