import { SerializeOptions, Get, Controller } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

import { type Health, healthSchema } from './health.schema';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOkResponse({ standardSchema: healthSchema })
  @SerializeOptions({ schema: healthSchema })
  check(): Health {
    return this.health.check();
  }
}
