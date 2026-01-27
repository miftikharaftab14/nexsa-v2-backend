import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express'; // ✅ Use express directly
import { SocketIOAdapter } from './common/adapters/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  app.enableCors({
    origin: '*',
    credentials: true, // if you're using cookies or Authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });
  // ✅ Allow large JSON and form payloads (100MB)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.useWebSocketAdapter(new SocketIOAdapter(app));
  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(new CustomValidationPipe());
  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.useGlobalInterceptors(new BigIntSerializerInterceptor());
  // these configuration is used to validate the swagger apis.
  const config = new DocumentBuilder()
    .setTitle('Nexsa')
    .setDescription('The Nexsa Api documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap().catch(err => {
  Logger.error('Error during application bootstrap', err);
  process.exit(1);
});
