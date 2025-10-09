import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const RequireMaster = () => SetMetadata(ROLES_KEY, ['M']);
export const RequireAdmin = () => SetMetadata(ROLES_KEY, ['M', 'A']);