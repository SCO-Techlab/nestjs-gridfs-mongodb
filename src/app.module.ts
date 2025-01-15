import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { GridfsModule } from '@app/nestjs-gridfs-mongodb';
 
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/nestjs-gridfs-mongodb'), 
    
    // Simple register with config object
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

    // Async register with config object, you can use env variables to load module here
    /* GridfsModule.registerAsync({
      useFactory: () => {
        return {
          bucketNames: ['client-files', 'worker-files'],
          indexes: [
            {
              bucketName: 'client-files',
              properties: ["position"],
              filename: true,
            }
          ]
        };
      }
    }), */
  ],
  controllers: [AppController],
  providers: [],
})

export class AppModule {}
