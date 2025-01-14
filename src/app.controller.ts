import { Controller, Get } from "@nestjs/common";

@Controller('nestjs-gridfs-mongodb')
export class AppController {

  constructor() {}

  @Get()
  async dummy() {
    return 'Hello world - Nestjs Gridfs Mongodb!';
  }
}
