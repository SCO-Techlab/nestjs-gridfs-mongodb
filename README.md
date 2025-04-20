## Nest.JS Gridfs MongoDB
Nest.JS Gridfs Mongodb is a multiple mongodb gridfs buckets management for Nest.JS framework.

### Get Started
- Install dependency
```bash
npm i @sco-techlab/nestjs-gridfs-mongodb
```
- Import GridfsModule module in your 'app.module.ts' file, register or registerAsync methods availables
```typescript
import { Module } from '@nestjs/common';
import { GridfsModule } from '@sco-techlab/nestjs-gridfs-mongodb';

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
    GridfsModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
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
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```
- Module import is global mode, to use gridfs service only need to provide constructor dependency inyection
```typescript
import { GridfsService } from '@sco-techlab/nestjs-gridfs-mongodb';

constructor(private gridfsService: GridfsService) {}
```

### Nest.JS Gridfs MongoDB config
```typescript
export class GridfsConfig {
  // Name of your buckets, for every bucket will create two collections, bucketName.files and bucketName.chunks
  bucketNames: string[];

  // Indexes configuration for every bucket, you can use this to create a unique index for a specific bucket, its totally optional
  indexes?: GridfsConfigMetadataIndex[]; 
}

// If not properties and filename provided, the index will be not applied and duplicated files will be allowed
export class GridfsConfigMetadataIndex {
  // Name of the bucket to apply this index object
  bucketName: string;

  // Properties of the GridfsFile metadata object values to apply unique condition, its totally optional
  properties?: string[];

  // If true, will create a unique index for the filename property, its totally optional
  filename?: boolean;
}
```

### Nest.JS Gridfs MongoDB types
```typescript
// Files management classes
export class GridfsFileMetadata {
  // Mimetype is always provided in metadata object
  mimetype?: string; 
  [key: string]: any;

  constructor(data: Partial&lt;GridfsFileMetadata&gt; = {}) {
    Object.assign(this, data);
  }
}

export class GridfsFileBuffer {
  // _id of the GridfsFile object
  _id?: string; 
  buffer?: Buffer;
  base64?: string;
}

export class GridfsFile {
  _id?: string;
  length?: number;
  chunkSize?: number;
  filename: string;
  metadata?: GridfsFileMetadata;
  uploadDate: Date;
  md5?: string;
  buffer?: GridfsFileBuffer;
}

// Class to manage the getFiles filter function
export class GridfsGetFileOptions {
  // Object with the properties to filter the documents, same work as moongose find filter
  filter?: any;

  // Will return the GridfsFile object with the buffer property, buffer includes the data and base64 of the file
  includeBuffer?: boolean;
}

export class GridfsUploadFileResponse {
  id: any;
  filename: string;
  metadata: GridfsFileMetadata;
}

export class GridfsDeleteFileResponse {
  deletedIds: string[];
  errorId?: string;
}
```

### Nest.JS Gridfs MongoDB service start
- To start the buckets service, you need to provide the connection object and call the setConnection method of the service.
- You should do it when your MongoDB connection is ready.
```typescript
import { Connection } from 'mongoose';
import { GridfsService } from '@sco-techlab/nestjs-gridfs-mongodb';

constructor(private gridfsService: GridfsService) {}

async start(connection: Connection) {
  await this.gridfsService.setConnection(connection);
}
```

### Controller example
```typescript
import { Body, Controller, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { GridfsFile, GridfsFileMetadata, GridfsGetFileOptions, GridfsService } from "@sco-techlab/nestjs-gridfs-mongodb";

@Controller('nestjs-gridfs-mongodb')
export class AppController {

  constructor(private readonly gridfsService: GridfsService) {}

  @Post('uploadFiles/:bucketName')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFiles(
    @UploadedFile() file: Express.Multer.File,
    @Param('bucketName') bucketName: string,
    @Body() data: any,
  ): Promise<GridfsUploadFileResponse[]> {
    // The body with metadata is optional, and it will be required to pass in text format (JSON.stringify // JSON.parse)
    // If you don't provide metadata, the file will be uploaded with default metadata with mimetype property value
    return await this.gridfsService.uploadFiles(
      bucketName, 
      [file], 
      data.body ? JSON.parse(data.body.toString()) as GridfsFileMetadata : undefined
    );
  }
  
  @Post('getFiles/:bucketName')
  async getFiles(
    @Param('bucketName') bucketName: string,
    @Body() options: GridfsGetFileOptions,
  ): Promise<GridfsFile[]> {
    /* 
      You provide options to manage query filter.
      Options is an object with the following properties:
      - filter: Object (Object with the properties to filter the documents, same work as moongose find filter)
      - includeBuffer: boolean (Will return the GridfsFile object with the buffer property, buffer includes the data and base64 of the file)
    */
    return await this.gridfsService.getFiles(bucketName, options);
  }

  @Post('deleteFiles/:bucketName')
  async deleteFiles(
    @Param('bucketName') bucketName: string,
    @Body() data: any,
  ): Promise<GridfsDeleteFileResponse> {
    return await this.gridfsService.deleteFiles(bucketName, Array.isArray(data._ids) ? data._ids : [data._ids]);
  }
}
```

## Changelog
- You can see the library's change history in the [Changelog](./CHANGELOG.md).

## Author
Santiago Comeras Oteo
- <a href="https://github.com/SCO-Techlab">GitHub</a>
- <a href="https://www.npmjs.com/settings/sco-techlab/packages">Npm</a>
- <a href="https://www.linkedin.com/in/santiago-comeras-oteo-4646191b3/">LinkedIn</a>

<p align="center">
  <img src="sco-techlab.png" alt="plot" width="250" />
</p>