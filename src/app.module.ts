import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { GridfsModule } from '@app/nestjs-gridfs-mongodb';
 
@Module({
  imports: [
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
