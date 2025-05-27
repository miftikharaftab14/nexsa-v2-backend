import { FileSize, MimeTypes } from '../constants/file';
import { BusinessException } from '../exceptions/business.exception';
import { LogMessages } from '../enums/logging.enum';

export const validateImageFile = (file: Express.Multer.File) => {
  // Check file size (5MB limit)
  if (file.size > FileSize.PROFILE_IMAGE_SIZE) {
    throw new BusinessException(LogMessages.FILE_SIZE_LIMT, 'FILE_SIZE_LIMT');
  }

  // Check file type
  const allowedMimeTypes = [MimeTypes.JPEG, MimeTypes.PNG, MimeTypes.JPG];
  if (!allowedMimeTypes.includes(file.mimetype as MimeTypes)) {
    throw new BusinessException(LogMessages.FILE_TYPE_JPG_PNG, 'FILE_TYPE_JPG_PNG');
  }
};
