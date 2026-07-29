import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('super_admin' | 'admin' | 'student')[]) =>
  SetMetadata(ROLES_KEY, roles);
