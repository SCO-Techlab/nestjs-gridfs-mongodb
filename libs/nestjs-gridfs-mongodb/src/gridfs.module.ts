import { DynamicModule, Module } from "@nestjs/common";
import { GridfsService } from "./gridfs.service";
import { GridfsManagerService } from "./gridfs.manager.service";
import { GridfsUtilsService } from "./gridfs.utils.service";

@Module({})
export class GridfsModule { 
  static register(): DynamicModule {
    return {
      module: GridfsModule,
      imports: [],
      controllers: [],
      providers: [GridfsService, GridfsManagerService, GridfsUtilsService],
      exports: [GridfsService],
      global: true
    };
  }
}