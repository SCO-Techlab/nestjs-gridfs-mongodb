import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GridfsModule } from '@app/nestjs-gridfs-mongodb';
 
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/nestjs-gridfs-mongodb'), 

    // Register GridfsModule exports GridfsService in global mode
    GridfsModule.register(),
  ],
  controllers: [
    AppController,
  ],
  providers: [
    AppService,
  ],
})

export class AppModule {}
