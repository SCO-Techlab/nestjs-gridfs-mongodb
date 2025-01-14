
import { Injectable } from '@nestjs/common';
import * as mongoose from 'mongoose';
import * as multer from 'multer';
import { GridfsFile, GridfsGetFileOptions } from './gridfs.types';
import { GridfsUtilsService } from './gridfs.utils.service';

@Injectable()
export class GridfsService {

  constructor(private readonly utils: GridfsUtilsService) {}

  async createBuckets(bucketNames: string[] | string, connection: mongoose.Connection) {
    return this.utils.createBuckets(bucketNames, connection);
  }

  async uploadFiles(bucketName: string, files: Express.Multer.File[] | Express.Multer.File): Promise<boolean> {
    return await this.utils.upload(bucketName, Array.isArray(files) ? files : [files]);
  }

  async getFiles(bucketName: string, options: GridfsGetFileOptions = {}): Promise<GridfsFile[]> {
    return await this.utils.fetch(bucketName, options) as GridfsFile[];
  }

  async getFile(bucketName: string, options: GridfsGetFileOptions = {}): Promise<GridfsFile> {
    return await this.utils.fetch(bucketName, options, true) as GridfsFile;
  }

  async deleteFile(bucketName: string, _id: string): Promise<boolean> {
    return await this.utils.delete(bucketName, [_id]);
  }

  async deleteFiles(bucketName: string, _ids: string[]): Promise<boolean> {
    return await this.utils.delete(bucketName, _ids);
  }
}