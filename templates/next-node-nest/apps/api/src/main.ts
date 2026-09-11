import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const config = new DocumentBuilder()
    .setTitle("Template API")
    .setDescription("NestJS API with Zod schemas")
    .setVersion("1.0.0")
    .build();
  SwaggerModule.setup("docs", app, () => SwaggerModule.createDocument(app, config));
  await app.listen(Number(process.env.PORT ?? 8080), "0.0.0.0");
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
