import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { GridfsModule } from '@app/nestjs-gridfs-mongodb';
 
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/nestjs-gridfs-mongodb'), 

    // Register GridfsModule exports GridfsService in global mode
    GridfsModule.register({
      bucketNames: ['client-files', 'worker-files'],
      indexes: [
        {
          bucketName: 'client-files',
          properties: ["position"],
          filename: true,
        }
      ]
    }),
  ],
  controllers: [AppController],
  providers: [],
})

export class AppModule {}
