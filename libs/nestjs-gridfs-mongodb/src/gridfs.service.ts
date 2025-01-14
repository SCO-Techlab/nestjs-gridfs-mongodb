
import { Injectable } from '@nestjs/common';
import { GridFSBucket, GridFSBucketReadStream, GridFSBucketWriteStream, GridFSFile, ObjectId } from 'mongodb';
import * as mongoose from 'mongoose';
import * as multer from 'multer';
import { GridfsFile, GridfsFileBuffer, GridfsGetFileOptions } from './gridfs.types';
import { GridfsManagerService } from './gridfs.manager.service';

@Injectable()
export class GridfsService {

  constructor(private readonly manager: GridfsManagerService) {}

  async createBuckets(bucketNames: string[] | string, connection: mongoose.Connection) {
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

  async uploadFiles(bucketName: string, files: Express.Multer.File[] | Express.Multer.File): Promise<boolean> {
    if (!this.manager.exist(bucketName))
      throw new Error(`[Gridfs - upload] Bucket ${bucketName} does not exist`);

    if (!files) 
      return false;

    files = Array.isArray(files) ? files : [files]
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

  async getFiles(bucketName: string, options: GridfsGetFileOptions = {}): Promise<GridfsFile[] | GridfsFile> {
    if (!this.manager.exist(bucketName))
      throw new Error(`[Gridfs - getFiles] Bucket ${bucketName} does not exist`);

    // Check if request is looking for a single document
    const single: boolean = options?.single ?? false;
    
    // Check filter and manage filter cases
    if (options && options.filter) {
      const filter_keys: string[] = Object.keys(options.filter);
      const filter_values: any[] = Object.values(options.filter);

      // Convert filter ids to ObjectId
      if (filter_keys && filter_keys.length > 0) {
        for (const key of filter_keys) {
          const index: number = filter_keys.indexOf(key);
          const value: any = filter_values[index];

          if (key.toUpperCase().includes('ID')) {
            options.filter[key] = new ObjectId(value as string);
          }
          
        }
      }
    }

    try {
      const files = await this.manager.get(bucketName).find(options.filter ?? {}).toArray();
      if (!files || files.length === 0) 
        return !single ? [] : undefined;

      const converted_files: GridfsFile[] = files.map(file => (convertGridfsFile(file)));
      if (!converted_files || converted_files.length === 0) 
        return !single ? [] : undefined;

      if (options.includeBuffer == true) {
        for (const file of converted_files) {
          const fileStream: GridFSBucketReadStream = this.manager.get(bucketName).openDownloadStream(new ObjectId(file._id.toString()));
          file.buffer = await getFileBuffer(file, fileStream);
        }
      }

      return !single 
        ? converted_files as GridfsFile[] 
        : converted_files[0] as GridfsFile;
    } catch (error) {
      console.log(`[Gridfs - getFiles] Error: ${error}`);
      return !single ? [] : undefined;
    }
  }

  async deleteFiles(bucketName: string, _ids: string[] | string): Promise<boolean> {
    if (!this.manager.exist(bucketName))
      throw new Error(`[Gridfs - deleteFiles] Bucket ${bucketName} does not exist`);

    if (!_ids || _ids.length === 0) 
      return false;

    if (typeof _ids === 'string')
      _ids = [_ids];

    try {
      for (const _id of _ids) 
        await this.manager.get(bucketName).delete(new ObjectId(_id)); 
      
      return true;
    } catch (error) {
      console.log(`[Gridfs - deleteFiles] Error: ${error}`);
      return false;
    }
  }
}

function convertGridfsFile(file: GridFSFile): GridfsFile {
  return {
    _id: file?._id.toString() ?? undefined,
    filename: file?.filename ?? undefined,
    length: file?.length ?? undefined,
    uploadDate: file?.uploadDate ?? undefined,
    metadata: file?.metadata ?? undefined,
    md5: file && file["md5"] ? file["md5"].toString() : undefined,
  };
}

async function getFileBuffer(file: GridfsFile, fileReadStream: GridFSBucketReadStream): Promise<GridfsFileBuffer> {
  if (!file || !fileReadStream)
    return undefined;

  return await new Promise<GridfsFileBuffer>((resolve) => {
    try {
      const chunks: Buffer[] = [];

      fileReadStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
  
      fileReadStream.on('error', () => {
        resolve(undefined);
      });
  
      fileReadStream.on('end', () => {
        const fileBuffer = Buffer.concat(chunks);
        const response: GridfsFileBuffer = {
          _id: file._id.toString(),
          buffer: fileBuffer,
          base64: `data:${file.metadata.mime_type};base64,${fileBuffer.toString('base64')}`,
        };

        resolve(response);
      });
    } catch (error) {
      console.log(`[Gridfs - getFileBuffer] Error: ${error}`);
      resolve(undefined);
    }
  });
}