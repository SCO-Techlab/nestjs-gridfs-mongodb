import { DynamicModule, Module, ModuleMetadata, Provider, Type } from "@nestjs/common";
import { GridfsService } from "./gridfs.service";
import { GridfsManagerService } from "./gridfs.manager.service";
import { GridfsConfig } from "./gridfs.config";

interface GridfsConfigFactory {
  createGridfsConfig(): Promise<GridfsConfig> | GridfsConfig;
}
export interface GridfsAsyncConfig
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useExisting?: Type<GridfsConfigFactory>;
  useClass?: Type<GridfsConfigFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<GridfsConfig> | GridfsConfig;
}

@Module({})
export class GridfsModule { 
  static register(options: GridfsConfig): DynamicModule {
    return {
      module: GridfsModule,
      imports: [],
      controllers: [],
      providers: [GridfsService, GridfsManagerService, { provide: 'CONFIG', useValue: options },],
      exports: [GridfsService],
      global: true
    };
  }

  public static registerAsync(options: GridfsAsyncConfig): DynamicModule {
    return {
      module: GridfsModule,
      imports: [],
      controllers: [],
      providers: [GridfsService, GridfsManagerService, ...this.createConnectProviders(options),],
      exports: [GridfsService],
      global: true
    };
  }

  private static createConnectProviders(options: GridfsAsyncConfig): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: 'CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        }
      ]
    }

    return [
      {
        provide: 'CONFIG',
        useFactory: async (optionsFactory: GridfsConfigFactory) =>  await optionsFactory.createGridfsConfig(),
        inject: [options.useExisting || options.useClass],
      }
    ];
  }
}