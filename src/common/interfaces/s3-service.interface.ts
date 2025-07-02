export interface IS3Service {
  uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ originalUrl: string; thumbnailUrl?: string }>;
  deleteFile(fileUrl: string): Promise<void>;
  getPresignedUrl(key: string, expiresIn?: number): Promise<string>;
  getFileVersions(key: string): Promise<string[]>;
  uploadFileVersion(file: Express.Multer.File, key: string): Promise<string>;
}
