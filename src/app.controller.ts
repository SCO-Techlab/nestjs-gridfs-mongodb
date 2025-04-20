import { Body, Controller, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { GridfsDeleteFileResponse, GridfsFile, GridfsFileMetadata, GridfsGetFileOptions, GridfsService, GridfsUploadFileResponse } from "@app/nestjs-gridfs-mongodb";

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
      data.body 
        ? JSON.parse(data.body.toString()) as GridfsFileMetadata
        : undefined
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
    return await this.gridfsService.deleteFiles(bucketName, data._ids ?? []);
  }
}
