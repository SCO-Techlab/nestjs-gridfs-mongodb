<p align="center">
  <img src="sco-techlab.png" alt="plot" width="250" />
</p>

## Nest.JS Gridfs MongoDB
Nest.JS Gridfs Mongodb is a multiple mongodb gridfs buckets management for Nest.JS framework.

### Get Started
- Install dependency
<pre>
npm i @sco-techlab/nestjs-gridfs-mongodb
</pre>
- Import GridfsModule module in your 'app.module.ts' file, register or registerAsync methods availables
<pre>
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GridfsModule } from '@sco-techlab/nestjs-gridfs-mongodb';

@Module({
  imports: [
    // A mongodb connection is required, you can use mongoose for example like this
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
})
export class AppModule {}
</pre>
- Module import is global mode, to use gridfs service only need to provide constructor dependency inyection

### Nest.JS Gridfs MongoDB config
<pre>
export class GridfsConfig {
  bucketNames: string[]; // Name of your buckets, for every bucket will create two collections, bucketName.files and bucketName.chunks
  indexes?: GridfsConfigMetadataIndex[]; // Indexes configuration for every bucket, you can use this to create a unique index for a specific bucket, its totally optional
}


// If not properties and filename provided, the index will be not applied and duplicated files will be allowed
export class GridfsConfigMetadataIndex {
  bucketName: string; // Name of the bucket to apply this index object
  properties?: string[]; // Properties of the GridfsFile metadata object values to apply unique condition, its totally optional
  filename?: boolean; // If true, will create a unique index for the filename property, its totally optional
}
</pre>

### Nest.JS Gridfs MongoDB types
<pre>

// Files management classes
export class GridfsFileMetadata {
  mimetype?: string; // mimetype is always provided in metadata object
  [key: string]: any;

  constructor(data: Partial&lt;GridfsFileMetadata&gt; = {}) {
    Object.assign(this, data);
  }
}

export class GridfsFileBuffer {
  _id?: string; // _id of the GridfsFile object
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
    filter?: any; // Object with the properties to filter the documents, same work as moongose find filter
    includeBuffer?: boolean; // Will return the GridfsFile object with the buffer property, buffer includes the data and base64 of the file
    single?: boolean; // Will return a single document (GridfsFile) or an array of documents (GridfsFile[])
}
</pre>

### Controller example
<pre>
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
  ): Promise&lt;boolean&gt; {
    // You can expect a single file (File) or an array of files (File[])
    // The body with metadata is optional, and it will be required to pass in text format (JSON.stringify // JSON.parse)
    // If you don't provide metadata, the file will be uploaded with default metadata with mimetype property value
    return await this.gridfsService.uploadFiles(
      bucketName, 
      file, 
      data.body 
        ? JSON.parse(data.body.toString()) as GridfsFileMetadata
        : undefined
    );
  }
  
  @Post('getFiles/:bucketName')
  async getFiles(
    @Param('bucketName') bucketName: string,
    @Body() options: GridfsGetFileOptions,
  ): Promise&lt;GridfsFile&gt; {
    /* 
      You provide options to manage query filter.
      Options is an object with the following properties:
      - filter: Object (Object with the properties to filter the documents, same work as moongose find filter)
      - includeBuffer: boolean (Will return the GridfsFile object with the buffer property, buffer includes the data and base64 of the file)
      - single: boolean (Will return a single document (GridfsFile) or an array of documents (GridfsFile[]))
    */
    return await this.gridfsService.getFiles(bucketName, options) as GridfsFile;
  }

  @Post('deleteFiles/:bucketName')
  async deleteFiles(
    @Param('bucketName') bucketName: string,
    @Body() data: any,
  ): Promise&lt;boolean&gt; {
    // You can expect a single id (string) or an array of ids (string[])
    return await this.gridfsService.deleteFiles(bucketName, data._ids ?? []);
  }
}
</pre>

## Author
Santiago Comeras Oteo
- <a href="https://web.sco-techlab.es/">SCO Techlab</a>
- <a href="https://github.com/SCO-Techlab">GitHub</a>
- <a href="https://www.npmjs.com/settings/sco-techlab/packages">Npm</a>
- <a href="https://www.linkedin.com/in/santiago-comeras-oteo-4646191b3/">LinkedIn</a>  

<p align="center">
  <img src="sco-techlab.png" alt="plot" width="250" />
</p>