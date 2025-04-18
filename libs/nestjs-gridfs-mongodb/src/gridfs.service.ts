
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { GridFSBucketReadStream, GridFSBucketWriteStream, ObjectId } from 'mongodb';
import { Connection } from 'mongoose';
import { GridfsConfig, GridfsConfigMetadataIndex } from './gridfs.config.interface';
import { GridfsManagerService } from './gridfs.manager.service';
import { GridfsFile, GridfsFileMetadata, GridfsGetFileOptions } from './gridfs.types.interface';
import { GridfsUtilsService } from './gridfs.utils.service';

@Injectable()
export class GridfsService {

  private _connection: Connection;

  public get connection(): Connection {
    return this._connection ?? undefined;
  }

  constructor(
    @Inject('CONFIG') private options: GridfsConfig,
    private readonly manager: GridfsManagerService,
    private readonly utils: GridfsUtilsService,
  ) {}

  public setConnection(connection: Connection): boolean {
    if (this._connection) {
      return false;
    }

    if (!this.validateConnection(connection)) {
      return false;
    }

    this._connection = connection;
    return true;
  }

  async uploadFiles(
    bucketName: string, 
    files: Express.Multer.File[] | Express.Multer.File, 
    metadata: GridfsFileMetadata = undefined
  ): Promise<boolean> {
    if (!this.manager.exist(bucketName))
      throw new HttpException(`[Gridfs] Bucket ${bucketName} does not exist`, HttpStatus.NOT_FOUND);

    files = !files ? [] : Array.isArray(files) ? files : [files];

    if (!files || files.length === 0) 
      throw new HttpException(`[Gridfs] Files are required`, HttpStatus.BAD_REQUEST);

    // Check if index exists
    const exist_index: GridfsConfigMetadataIndex = this.options.indexes?.find(index => index.bucketName === bucketName) ?? undefined;

    try {
      for (const file of files) {

        // Index exist for this bucketName, will check if a file document already exists
        if (exist_index) {
          if (await this.existIndexDocument(bucketName, exist_index, metadata ?? {}, file.originalname)) {
            throw new HttpException(`[Gridfs] ${this.utils.formatIndexUniqueError(bucketName, exist_index)}`, HttpStatus.CONFLICT);
          }
        }

        // If metadata is not provided, create a new GridfsFileMetadata
        // mimetype is required, so will be provied as default in every case
        if (metadata)
          metadata.mimetype = file.mimetype ?? 'application/octet-stream';
        else
          metadata = new GridfsFileMetadata({ mimetype: file.mimetype ?? 'application/octet-stream' });

        const upload_stream: GridFSBucketWriteStream = this.manager.get(bucketName).openUploadStream(
          file.originalname, 
          { metadata: metadata }
        );

        upload_stream.end(file.buffer);
      }
      
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      return false;
    }
  }

  async getFiles(bucketName: string, options: GridfsGetFileOptions = {}): Promise<GridfsFile[] | GridfsFile> {
    if (!this.manager.exist(bucketName))
      throw new HttpException(`[Gridfs] Bucket '${bucketName}' does not exist`, HttpStatus.NOT_FOUND);

    const single: boolean = options?.single ?? false;
    
    // Check filter and manage filter cases
    if (options && options.filter) {
      options.filter = this.utils.formatGetFileFilter(options.filter);
    }

    try {
      const files = await this.manager.get(bucketName).find(options.filter ?? {}).toArray();
      if (!files || files.length === 0) 
        return !single ? [] : undefined;

      const converted_files: GridfsFile[] = files.map(file => (this.utils.convertGridfsFile(file)));
      if (!converted_files || converted_files.length === 0) 
        return !single ? [] : undefined;

      if (options.includeBuffer == true) {
        for (const file of converted_files) {
          const file_stream: GridFSBucketReadStream = this.manager.get(bucketName).openDownloadStream(new ObjectId(file._id.toString()));
          file.buffer = await this.utils.getFileBuffer(file, file_stream);
        }
      }

      return !single ? converted_files as GridfsFile[] : converted_files[0] as GridfsFile;
    } catch (error) {
      return !single ? [] : undefined;
    }
  }

  async deleteFiles(bucketName: string, _ids: string[] | string): Promise<boolean> {
    if (!this.manager.exist(bucketName))
      throw new HttpException(`[Gridfs] Bucket ${bucketName} does not exist`, HttpStatus.NOT_FOUND);

    if (!_ids || _ids.length === 0) 
      throw new HttpException(`[Gridfs] Ids are required`, HttpStatus.BAD_REQUEST);

    if (typeof _ids === 'string')
      _ids = [_ids];

    try {
      for (const _id of _ids) 
        await this.manager.get(bucketName).delete(new ObjectId(_id)); 
      return true;
    } catch (error) {
      return false;
    }
  }

  private validateConnection(connection: Connection): boolean {
    const error: Error = this.utils.validateSetConnection(connection, this.options);
    if (error) {
      throw error;
    }
    return true;
  }

  private async existIndexDocument(
    bucketName: string, 
    index: GridfsConfigMetadataIndex, 
    metadata: GridfsFileMetadata, 
    filename: string
  ): Promise<GridfsFile | undefined> {
    const filter: any = {};
  
    // If properties are provided, add them to the filter
    if (index.properties && index.properties.length > 0) {
      for (const property of index.properties) {
        filter[`metadata.${property}`] = metadata[property];
      }
    }
  
    // If filename unique index is enabled, add it to the filter
    if (index.filename) {
      filter['filename'] = filename;
    }
  
    // If filter is empty not continue with the check
    if (!filter || Object.keys(filter).length === 0) {
      return undefined;
    }
  
    const getOptions: GridfsGetFileOptions = { filter: filter, single: true };
    const file: GridfsFile = await this.getFiles(bucketName, getOptions) as GridfsFile;
    return file ? file : undefined;
  }
}