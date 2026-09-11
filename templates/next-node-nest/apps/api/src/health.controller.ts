import { Controller, Get, SerializeOptions } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";
import { healthSchema, type Health } from "./health.schema";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOkResponse({ standardSchema: healthSchema })
  @SerializeOptions({ schema: healthSchema })
  check(): Health {
    return this.health.check();
  }
}
