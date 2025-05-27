declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: FileSize.PROFILE_IMAGE_SIZE;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}
