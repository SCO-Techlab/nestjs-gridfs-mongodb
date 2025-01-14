import { Body, Controller, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { GridfsFile, GridfsFileMetadata, GridfsGetFileOptions, GridfsService } from "@app/nestjs-gridfs-mongodb";

@Controller('nestjs-gridfs-mongodb')
export class AppController {

  constructor(private readonly gridfsService: GridfsService) {}

  @Post('uploadFiles/:bucketName')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFiles(
    @UploadedFile() file: Express.Multer.File,
    @Param('bucketName') bucketName: string,
    @Body() data: any,
  ): Promise<boolean> {
    // You can expect a single file (File) or an array of files (File[])
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
  ): Promise<GridfsFile> {
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
  ): Promise<boolean> {
    // You can expect a single id (string) or an array of ids (string[])
    return await this.gridfsService.deleteFiles(bucketName, data._ids ?? []);
  }
}
