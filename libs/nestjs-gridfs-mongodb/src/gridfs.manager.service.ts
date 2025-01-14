import { Injectable } from "@nestjs/common";
import { GridFSBucket } from "mongodb";

@Injectable()
export class GridfsManagerService {

  private _buckets: Map<string, GridFSBucket>;

  constructor() { 
    this._buckets = new Map();
  }

  total(): number {
    if (!this._buckets || this._buckets.size <= 0) return 0;
    return this._buckets.size;
  }

  keys(): string[] {
    if (!this._buckets || this._buckets.size == 0) return [];
    return Array.from(this._buckets.keys());
  }

  exist(name: string): boolean {
    return this._buckets.has(name);
  }

  get(name: string): GridFSBucket {
    if (!this.exist(name)) return undefined;
    return this._buckets.get(name);
  }

  set(name: string, gridfsBucket: GridFSBucket): boolean {
    if (!this._buckets) return false;
    this._buckets.set(name, gridfsBucket);
    return true;
  }

  delete(name: string): boolean {
    if (!this.exist(name)) return false;
    return this._buckets.delete(name);
  }
}