import { DynamicModule, Module } from "@nestjs/common";
import { GridfsService } from "./gridfs.service";
import { GridfsManagerService } from "./gridfs.manager.service";

@Module({})
export class GridfsModule { 
  static register(): DynamicModule {
    return {
      module: GridfsModule,
      imports: [],
      controllers: [],
      providers: [GridfsService, GridfsManagerService],
      exports: [GridfsService],
      global: true
    };
  }
}