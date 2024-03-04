import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.enableCors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      "https://trienv.trauty.dev",
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true
    }),
  );

  await app.listen(3002);
}
bootstrap();
