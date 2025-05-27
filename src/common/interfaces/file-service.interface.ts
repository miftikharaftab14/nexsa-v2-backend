import { File } from '../../files/entities/file.entity';

export interface IFileService {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<File>;
  uploadFileVersion(file: Express.Multer.File, fileId: number): Promise<File>;
  getPresignedUrl(fileId: number, expiresIn?: number): Promise<string>;
  getFileVersions(fileId: number): Promise<File[]>;
  deleteFile(id: number): Promise<void>;
  getFile(id: number): Promise<File>;
}
