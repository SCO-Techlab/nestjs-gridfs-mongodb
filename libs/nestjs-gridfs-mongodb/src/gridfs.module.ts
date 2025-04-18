import { DynamicModule, Module, ModuleMetadata, Provider, Type } from "@nestjs/common";
import { GridfsConfig } from "./gridfs.config.interface";
import { GridfsManagerService } from "./gridfs.manager.service";
import { GridfsService } from "./gridfs.service";
import { GridfsUtilsService } from "./gridfs.utils.service";

interface GridfsConfigFactory {
  createGridfsConfig(): Promise<GridfsConfig> | GridfsConfig;
}

interface GridfsAsyncConfig
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
      providers: [
        { provide: 'CONFIG', useValue: options },
        GridfsService, 
        GridfsManagerService,
        GridfsUtilsService
      ],
      exports: [GridfsService],
      global: true
    };
  }

  public static registerAsync(options: GridfsAsyncConfig): DynamicModule {
    return {
      module: GridfsModule,
      imports: [],
      controllers: [],
      providers: [
        ...createConnectProviders(options),
        GridfsService, 
        GridfsManagerService,
        GridfsUtilsService
      ],
      exports: [GridfsService],
      global: true
    };
  }
}

function createConnectProviders(options: GridfsAsyncConfig): Provider[] {
  if (options.useFactory) {
    return [
      { provide: 'CONFIG', useFactory: options.useFactory, inject: options.inject || [] }
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