import { Injectable } from "@nestjs/common";
import { GridFSBucket, GridFSBucketReadStream, GridFSFile, ObjectId } from "mongodb";
import { Connection } from "mongoose";
import { GridfsConfig, GridfsConfigMetadataIndex } from "./gridfs.config.interface";
import { GridfsManagerService } from "./gridfs.manager.service";
import { GridfsFile, GridfsFileBuffer, GridfsFileMetadata } from "./gridfs.types.interface";

@Injectable()
export class GridfsUtilsService {

  constructor(private readonly manager: GridfsManagerService) { }

  public validateSetConnection(connection: Connection, options: GridfsConfig): Error {
    if (!connection)
      return new Error('[Gridfs] MongoDB connection is required');
  
    if (!options)
      return new Error('[Gridfs] Gridfs config is required');
  
    if (!options.bucketNames || options.bucketNames.length === 0) {
      return new Error('[Gridfs] Gridfs bucket names not provided');
    }
  
    const not_unique_error: Error = this.bucketNamesAreUnique(options.bucketNames);
    if (not_unique_error) {
      return not_unique_error;
    }
  
    const not_unique_indexes_error: Error = this.bucketIndexesAreUnique(options.indexes);
    if (not_unique_indexes_error) {
      return not_unique_indexes_error;
    }
  
    let buckets_loaded: boolean = false;
    try {
      for (const bucket_name of options.bucketNames) {
        this.manager.set(bucket_name, new GridFSBucket(connection.db, {
          bucketName: bucket_name,
        }));
      }
      buckets_loaded = true;
    } catch (error) {
      buckets_loaded = false;
    }
  
    if (!buckets_loaded) {
      return new Error('[Gridfs] Error loading buckets');
    }

    return undefined;
  }

  public bucketNamesAreUnique(buckets: string[] = []): Error {
    if (!buckets || buckets.length === 0) {
      return undefined;
    }

    const bucket_names: string[] = [];
    for (const bucket_name of buckets) {
      if (bucket_names.length == 0) {
        bucket_names.push(bucket_name);
        continue;
      }
  
      if (bucket_names.find(b => b === bucket_name)) {
        return new Error(`[Gridfs] Gridfs bucket name '${bucket_name}' already loaded`);
      }

      bucket_names.push(bucket_name);
    }

    return undefined;
  }

  public bucketIndexesAreUnique(indexes: GridfsConfigMetadataIndex[] = []): Error {
    if (!indexes || indexes.length === 0) {
      return undefined;
    }

    const bucket_names: string[] = [];
    for (const index of indexes) {
      if (!index.bucketName)
        throw new Error('[Gridfs] Gridfs index bucketName is required');

      if (bucket_names.length == 0) {
        bucket_names.push(index.bucketName);
        continue;
      }

      if (bucket_names.find(b => b === index.bucketName))
        throw new Error(`[Gridfs] Gridfs index bucket name '${index.bucketName}' already loaded`);

      bucket_names.push(index.bucketName);
    }

    return undefined;
  }

  public convertGridfsFile(file: GridFSFile): GridfsFile {
    return {
      _id: file?._id.toString() ?? undefined,
      filename: file?.filename ?? undefined,
      length: file?.length ?? undefined,
      uploadDate: file?.uploadDate ?? undefined,
      metadata: new GridfsFileMetadata(file.metadata ?? { mimetype: undefined }),
      md5: file && file["md5"] ? file["md5"].toString() : undefined,
      buffer: undefined,
    };
  }

  public async getFileBuffer(file: GridfsFile, fileReadStrean: GridFSBucketReadStream): Promise<GridfsFileBuffer> {
    if (!file || !fileReadStrean)
      return undefined;
  
    return await new Promise<GridfsFileBuffer>((resolve) => {
      try {
        const chunks: Buffer[] = [];
  
        fileReadStrean.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
    
        fileReadStrean.on('error', () => {
          resolve(undefined);
        });
    
        fileReadStrean.on('end', () => {
          const file_buffer = Buffer.concat(chunks);
          const response: GridfsFileBuffer = {
            _id: file._id.toString(),
            buffer: file_buffer,
            base64: `data:${file.metadata.mimetype};base64,${file_buffer.toString('base64')}`,
          };
  
          resolve(response);
        });
      } catch (error) {
        resolve(undefined);
      }
    });
  }

  public formatIndexUniqueError(bucket_name: string, index: GridfsConfigMetadataIndex): string {
    return `File already exist in bucket '${bucket_name}' in properties '${index.filename ? 'filename, ' : ''}${index.properties.join(', ')}'`;
  }

  public formatGetFileFilter(filter: any): any {
    const filter_keys: string[] = Object.keys(filter) ?? [];
    const filter_values: any[] = Object.values(filter) ?? [];

    if (!filter_keys || filter_keys.length === 0) {
      return filter;
    }

    // Convert filter ids to ObjectId
    for (const key of filter_keys) {
      const index: number = filter_keys.indexOf(key);
      const value: any = filter_values[index];

      if (key.toUpperCase().includes('ID')) {
        filter[key] = new ObjectId(value as string);
      }
    }

    return filter;
  }
}
