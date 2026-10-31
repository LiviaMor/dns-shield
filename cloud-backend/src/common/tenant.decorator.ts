import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Extrai o identificador de tenant (clínica) do header `X-Tenant-Id`.
 * Garante o isolamento multi-tenant: toda operação é escopada por este valor.
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const tenant = request.header('x-tenant-id');
    if (!tenant || !/^[a-z0-9-]{3,64}$/.test(tenant)) {
      throw new BadRequestException(
        'Header X-Tenant-Id ausente ou inválido (use [a-z0-9-], 3-64 chars).',
      );
    }
    return tenant;
  },
);
