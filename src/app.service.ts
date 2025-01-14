import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { GridfsService } from "@app/nestjs-gridfs-mongodb";

@Injectable()
export class AppService {

    constructor(
        @InjectConnection() private readonly connection: Connection,
        private readonly gridfsService: GridfsService,
    ) { }

    async onModuleInit() {
        // Create a single bucket, only one collection of files you can pass a string as bucket name
        await this.gridfsService.createBuckets("singlebucket-files", this.connection);

        // Create multiple buckets, will create a collection of files for each bucket, you can pass an array of strings as bucket names
        await this.gridfsService.createBuckets(
            [
                "client-files",
                "worker-files"
            ],
            this.connection
        );
    }

}
