import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips non-declared properties
      forbidNonWhitelisted: true, // throws if unknown props exist
      transform: true, // auto-transforms to DTO types
    }),
  );

  // these configuration is used to validate the swagger apis.
  const config = new DocumentBuilder() //1
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
  const document = SwaggerModule.createDocument(app, config); //2
  SwaggerModule.setup('api', app, document); //3
  await app.listen(process.env.PORT ?? 8090);
}
bootstrap();
