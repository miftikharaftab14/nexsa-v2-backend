export interface IS3Service {
  uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ originalUrl: string; thumbnailUrl?: string }>;
  deleteFile(fileUrl: string): Promise<void>;
  getPresignedUrl(key: string, expiresIn?: number): Promise<string>;
  getFileVersions(key: string): Promise<string[]>;
  uploadFileVersion(file: Express.Multer.File, key: string): Promise<string>;
  uploadBuffer(
    buffer: Buffer,
    originalName: string,
    mimetype: string,
    folder?: string,
  ): Promise<{ originalUrl: string; thumbnailUrl?: string }>;
  generatePresignedUrls(
    files: Array<{ fileName: string; fileType: string }>,
    folderPath: string,
  ): Promise<
    Array<{
      fileName: string;
      fileType: string;
      index: number;
      key: string;
      presignedUrl: string;
      getUrl: string;
      cloudFrontUrl: string;
    }>
  >;
}
