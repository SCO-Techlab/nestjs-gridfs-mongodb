import { Injectable } from "@nestjs/common";
import { Connection } from "mongoose";
import { GridFSBucket, GridFSBucketWriteStream, GridFSFile, ObjectId } from "mongodb";
import { GridfsFile, GridfsFileBuffer, GridfsGetFileOptions } from "./gridfs.types";
import { GridfsManagerService } from "./gridfs.manager.service";

@Injectable()
export class GridfsUtilsService {

  constructor(private readonly manager: GridfsManagerService) {}

  createBuckets(bucketNames: string | string[], connection: Connection): void {
    if (!bucketNames || bucketNames.length === 0)
      throw new Error('[Gridfs - createBuckets] Bucket names are required');

    if (!connection)
      throw new Error('[Gridfs - createBuckets] MongoDB connection is required');

    if (typeof bucketNames === 'string')
      bucketNames = [bucketNames];

    try {
      for (const bucketName of bucketNames) {
        this.manager.set(bucketName, new GridFSBucket(connection.db, {
          bucketName: bucketName,
        }));
      }
    } catch (error) {
      console.log(`[Gridfs - createBuckets] Error: ${error}`);
    }
  }

  convertGridfsFile(file: GridFSFile): GridfsFile {
    return {
      _id: file?._id.toString() ?? undefined,
      filename: file?.filename ?? undefined,
      length: file?.length ?? undefined,
      uploadDate: file?.uploadDate ?? undefined,
      metadata: file?.metadata ?? undefined,
      md5: file && file["md5"] ? file["md5"].toString() : undefined,
    };
  }

  async upload(bucketName: string, files: Express.Multer.File[]): Promise<boolean> {
    if (!this.manager.exist(bucketName))
      throw new Error(`[Gridfs - upload] Bucket ${bucketName} does not exist`);

    if (!files || files.length === 0) 
      return false;

    try {
      for (const file of files) {
        // if (await this.existFile(bookingId, contractPosition)) {
        //   await this.deleteFile((await this.existFile(bookingId, contractPosition))._id);
        // }

        const uploadStream: GridFSBucketWriteStream = this.manager.get(bucketName).openUploadStream(file.originalname, {
          metadata: {
            mime_type: file.mimetype ?? 'application/octet-stream',
          }
        });

        uploadStream.end(file.buffer);
      }
      
      return true;
    } catch (error) {
      console.log(`[Gridfs - upload] Error: ${error}`);
      return false;
    }
  }

  async fetch(bucketName: string, options: GridfsGetFileOptions, single: boolean = false): Promise<GridfsFile[] | GridfsFile> {
    if (!this.manager.exist(bucketName))
      throw new Error(`[Gridfs - fetch] Bucket ${bucketName} does not exist`);

    try {
      const files = await this.manager.get(bucketName).find(options.filter ?? {}).toArray();
      if (!files || files.length === 0) 
        return !single ? [] : undefined;

      const converted_files: GridfsFile[] = files.map(file => (this.convertGridfsFile(file)));
      if (!converted_files || converted_files.length === 0) 
        return !single ? [] : undefined;

      if (options.includeBuffer) {
        for (const file of converted_files) 
          file.buffer = await this.fetchBuffer(bucketName, file);
      }

      return !single ? converted_files : converted_files[0];
    } catch (error) {
      console.log(`[Gridfs - fetch] Error: ${error}`);
      return !single ? [] : undefined;
    }
  }

  async fetchBuffer(bucketName: string, file: GridfsFile): Promise<GridfsFileBuffer> {
    if (!this.manager.exist(bucketName))
      throw new Error(`[Gridfs - fetchBuffer] Bucket ${bucketName} does not exist`);

    if (!file) 
      return undefined;

    return await new Promise<GridfsFileBuffer>((resolve) => {
      try {
        const fileStream = this.manager.get(bucketName).openDownloadStream(new ObjectId(file._id.toString()));
        const chunks: Buffer[] = [];

        fileStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
    
        fileStream.on('error', () => {
          resolve(undefined);
        });
    
        fileStream.on('end', () => {
          const fileBuffer = Buffer.concat(chunks);
          const response: GridfsFileBuffer = {
            _id: file._id.toString(),
            buffer: fileBuffer,
            base64: `data:${file.metadata.mime_type};base64,${fileBuffer.toString('base64')}`,
          };
  
          resolve(response);
        });
      } catch (error) {
        console.log(`[Gridfs - fetchBuffer] Error: ${error}`);
        resolve(undefined);
      }
    });
  }

  async delete(bucketName: string, _ids: string[]): Promise<boolean> {
    if (!this.manager.exist(bucketName))
      throw new Error(`[Gridfs - delete] Bucket ${bucketName} does not exist`);

    if (!_ids || _ids.length === 0) 
      return false;

    try {
      for (const _id of _ids) 
        await this.manager.get(bucketName).delete(new ObjectId(_id)); 
      
      return true;
    } catch (error) {
      console.log(`[Gridfs - delete] Error: ${error}`);
      return false;
    }
  }
}