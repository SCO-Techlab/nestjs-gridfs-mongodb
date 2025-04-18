export class GridfsConfig {
    bucketNames: string[];
    indexes?: GridfsConfigMetadataIndex[];
}

export class GridfsConfigMetadataIndex {
    bucketName: string;
    properties?: string[];
    filename?: boolean;
}