export class GridfsFile {
    _id?: string;
    length?: number;
    chunkSize?: number;
    filename: string;
    metadata?: GridfsFileMetadata;
    uploadDate: Date;
    md5?: string;
    buffer?: GridfsFileBuffer;
}

export class GridfsFileMetadata {
    mime_type?: string;
}

export class GridfsFileBuffer {
    _id?: string;
    buffer?: Buffer;
    base64?: string;
}

export class GridfsGetFileOptions {
    filter?: any;
    includeBuffer?: boolean;
    single?: boolean;
}