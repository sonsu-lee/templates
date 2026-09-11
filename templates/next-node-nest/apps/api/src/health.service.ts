import { Injectable } from '@nestjs/common';

import type { Health } from './health.schema';

@Injectable()
export class HealthService {
  check(): Health {
    return { status: 'ok' };
  }
}
