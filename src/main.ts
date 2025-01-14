import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, 
    { 
      logger: new Logger(),
    }
  );

  await app.listen(3005);
  console.log(`[App] App started in 'http://localhost:3005'`);
}
bootstrap();