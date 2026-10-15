import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const port = Number(process.env.API_PORT ?? 3001);
  const webPort = Number(process.env.WEB_PORT ?? 3000);
  const webOrigins = [
    `http://localhost:${webPort}`,
    `http://127.0.0.1:${webPort}`,
  ];

  app.enableCors({
    origin: webOrigins,
    credentials: true,
  });

  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(port, "0.0.0.0");
  new Logger("Bootstrap").log(`API listening on http://0.0.0.0:${port}/api`);
}

bootstrap();
