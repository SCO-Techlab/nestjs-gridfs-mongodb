
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { GridFSBucket, GridFSBucketReadStream, GridFSBucketWriteStream, GridFSFile, ObjectId } from 'mongodb';
import * as multer from 'multer';
import { GridfsFile, GridfsFileBuffer, GridfsFileMetadata, GridfsGetFileOptions } from './gridfs.types';
import { GridfsManagerService } from './gridfs.manager.service';
import { GridfsConfig } from './gridfs.config';


@Injectable()
export class GridfsService {

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject('CONFIG') private options: GridfsConfig,
    private readonly manager: GridfsManagerService,
  ) {
    init.bind(this)();
  }

  async uploadFiles(bucketName: string, files: Express.Multer.File[] | Express.Multer.File, metadata: GridfsFileMetadata = undefined): Promise<boolean> {
    if (!this.manager.exist(bucketName))
      throw new HttpException(`[Gridfs - upload] Bucket ${bucketName} does not exist`, HttpStatus.NOT_FOUND);

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

        if (metadata)
          metadata.mimetype = file.mimetype ?? 'application/octet-stream';
        else
          metadata = new GridfsFileMetadata({ mimetype: file.mimetype ?? 'application/octet-stream' });

        const uploadStream: GridFSBucketWriteStream = this.manager.get(bucketName).openUploadStream(file.originalname, {
          metadata: metadata,
        });

        uploadStream.end(file.buffer);
      }
      
      return true;
    } catch (error) {
      console.error(`[Gridfs - upload] Error: ${error}`);
      return false;
    }
  }

  async getFiles(bucketName: string, options: GridfsGetFileOptions = {}): Promise<GridfsFile[] | GridfsFile> {
    if (!this.manager.exist(bucketName))
      throw new HttpException(`[Gridfs - getFiles] Bucket ${bucketName} does not exist`, HttpStatus.NOT_FOUND);

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
      console.error(`[Gridfs - getFiles] Error: ${error}`);
      return !single ? [] : undefined;
    }
  }

  async deleteFiles(bucketName: string, _ids: string[] | string): Promise<boolean> {
    if (!this.manager.exist(bucketName))
      throw new HttpException(`[Gridfs - deleteFiles] Bucket ${bucketName} does not exist`, HttpStatus.NOT_FOUND);

    if (!_ids || _ids.length === 0) 
      return false;

    if (typeof _ids === 'string')
      _ids = [_ids];

    try {
      for (const _id of _ids) 
        await this.manager.get(bucketName).delete(new ObjectId(_id)); 
      
      return true;
    } catch (error) {
      console.error(`[Gridfs - deleteFiles] Error: ${error}`);
      return false;
    }
  }
}

function init() {
  if (!this.connection)
    throw new Error('[Gridfs - init] MongoDB connection is required');

  if (!this.options)
    throw new Error('[Gridfs - init] Gridfs config is required');

  if (!this.options.bucketNames || this.options.bucketNames.length === 0) {
    console.warn('[Gridfs - init] Gridfs bucketNames not provided');
    return;
  }

  try {
    for (const bucketName of this.options.bucketNames) {
      this.manager.set(bucketName, new GridFSBucket(this.connection.db, {
        bucketName: bucketName,
      }));
    }
  } catch (error) {
    console.error(`[Gridfs - init] Error: ${error}`);
  }
}

function convertGridfsFile(file: GridFSFile): GridfsFile {
  return {
    _id: file?._id.toString() ?? undefined,
    filename: file?.filename ?? undefined,
    length: file?.length ?? undefined,
    uploadDate: file?.uploadDate ?? undefined,
    metadata: new GridfsFileMetadata(file.metadata ?? { mimetype: undefined }),
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
          base64: `data:${file.metadata.mimetype};base64,${fileBuffer.toString('base64')}`,
        };

        resolve(response);
      });
    } catch (error) {
      console.error(`[Gridfs - getFileBuffer] Error: ${error}`);
      resolve(undefined);
    }
  });
}