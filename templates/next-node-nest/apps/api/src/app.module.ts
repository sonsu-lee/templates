import {
  Module,
  StandardSchemaValidationPipe,
  StandardSchemaSerializerInterceptor,
} from "@nestjs/common";
import { APP_PIPE, APP_INTERCEPTOR } from "@nestjs/core";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: StandardSchemaSerializerInterceptor },
  ],
})
export class AppModule {}
