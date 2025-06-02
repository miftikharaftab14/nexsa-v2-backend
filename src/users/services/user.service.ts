import { Injectable, Logger, Inject } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { LogMessages, LogContexts } from 'src/common/enums/logging.enum';
import { DataSource } from 'typeorm';
import { IFileService } from '../../common/interfaces/file-service.interface';
import { InjectionToken } from '../../common/constants/injection-tokens';
import { validateImageFile } from '../../common/validators/file.validator';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { ConfigService } from '@nestjs/config';
import { ExtendedUser } from '../interfaces/user.interface';
import { UserRole } from 'src/common/enums/user-role.enum';

/**
 * Service responsible for managing user-related operations including CRUD operations,
 * profile picture management, and user preferences.
 * Handles user data persistence, file uploads, and S3 storage integration.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(LogContexts.USER);
  private readonly s3Folder: string;
  /**
   * Initializes the UserService with required dependencies.
   * @param fileService - Service for file management operations
   * @param userRepo - Repository for user data operations
   * @param dataSource - TypeORM data source for transaction management
   * @param configService - Service for accessing configuration values
   */
  constructor(
    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: IFileService,
    private readonly userRepo: UserRepository,
    private dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    const s3Folder = this.configService.get<string>('AWS_S3_FOLDER_NAME');
    if (!s3Folder) {
      throw new Error(LogMessages.MISSING_AWS_CONFIGURATION);
    }
    this.s3Folder = s3Folder;
  }

  /**
   * Creates a new user in the system.
   * @param data - User creation data including required fields
   * @returns Promise<User> - The created user object
   * @throws Error if user creation fails
   */
  async create(data: CreateUserDto): Promise<User> {
    try {
      this.logger.debug(LogMessages.USER_CREATE_ATTEMPT, data.phone_number);
      const user = await this.userRepo.create(data);
      this.logger.log(LogMessages.USER_CREATE_SUCCESS, user.id);
      return user;
    } catch (error) {
      this.logger.error(
        LogMessages.USER_CREATE_FAILED,
        error instanceof Error ? error.message : LogMessages.UNKNOWN_ERROR,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Retrieves all users from the system.
   * @returns Promise<User[]> - Array of all users
   * @throws Error if retrieval fails
   */
  async findAll(): Promise<User[]> {
    try {
      this.logger.debug(LogMessages.ATTEMPT_TO_FETCH_ALL_USER);
      const users = await this.userRepo.findAll();
      this.logger.log(`Successfully fetched ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(
        'Failed to fetch users',
        error instanceof Error ? error.message : LogMessages.UNKNOWN_ERROR,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
  /**
   * Retrieves a single user by their ID.
   * @param id - The unique identifier of the user
   * @returns Promise<User | null> - The found user or null if not found
   * @throws Error if retrieval fails
   */
  async findOne(id: number): Promise<User | null> {
    try {
      this.logger.debug(LogMessages.USER_FETCH_ATTEMPT, id);
      const user = await this.userRepo.findOneById(id);
      if (!user) {
        this.logger.warn(LogMessages.USER_NOT_FOUND, id);
      } else {
        this.logger.log(LogMessages.USER_FETCH_SUCCESS, id);
      }
      return user;
    } catch (error) {
      this.logger.error(
        LogMessages.USER_FETCH_FAILED,
        error instanceof Error ? error.message : LogMessages.UNKNOWN_ERROR,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
  /**
   * Updates an existing user's information.
   * Handles profile picture updates and user preferences.
   * @param id - The unique identifier of the user to update
   * @param updateUserDto - The data to update the user with
   * @returns Promise<ExtendedUser> - The updated user with presigned URL if applicable
   * @throws BusinessException if user not found or update fails
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<ExtendedUser> {
    const queryRunner = this.dataSource.createQueryRunner();
    const imageDetails: {
      fileId: number;
      url: string;
    } = {
      fileId: 0,
      url: '',
    };
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      this.logger.debug(LogMessages.USER_UPDATE_ATTEMPT, id);

      const user = await this.userRepo.findOneById(id);
      if (!user) {
        throw new BusinessException(LogMessages.USER_NOT_FOUND, 'USER_NOT_FOUND', {
          user: id,
        });
      }
      // Handle image upload if present
      if (updateUserDto.image) {
        // Validate the image file
        validateImageFile(updateUserDto.image);

        // Upload new image to S3
        const imageData = await this.updateProfilePicture(
          Number(user.id),
          updateUserDto.image,
          this.s3Folder,
        );
        imageDetails.fileId = imageData.fileId;
        imageDetails.url = imageData.url;
      }
      let preferences = updateUserDto.preferences;
      if (typeof preferences === 'string') {
        try {
          preferences = JSON.parse(preferences) as string[];
        } catch (e) {
          this.logger.warn(LogMessages.FAILED_TO_PARSE, e);
          preferences = [];
        }
      }
      // Update other user fields
      const updatedUser = await this.userRepo.update(id, {
        ...(updateUserDto.username && { username: updateUserDto.username }),
        ...(updateUserDto.email && { email: updateUserDto.email }),
        ...(updateUserDto.about_me && { about_me: updateUserDto.about_me }),
        ...(updateUserDto.preferences && { preferences: preferences }),
        ...(updateUserDto.link && { link: updateUserDto.link }),
      });

      await queryRunner.commitTransaction();
      this.logger.log(LogMessages.USER_UPDATE_SUCCESS, id);
      return { ...updatedUser, presignedURL: imageDetails.url } as ExtendedUser;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : LogMessages.UNKNOWN_ERROR;
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(LogMessages.USER_UPDATE_FAILED, errorMessage, errorStack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  /**
   * Adds a new preference to a user's preferences list.
   * @param userId - The unique identifier of the user
   * @param preference - The preference to add
   * @returns Promise<User> - The updated user object
   */
  async addPreference(userId: number, preference: string): Promise<User> {
    return this.userRepo.addPreference(userId, preference);
  }
  /**
   * Removes a preference from a user's preferences list.
   * @param userId - The unique identifier of the user
   * @param preference - The preference to remove
   * @returns Promise<User> - The updated user object
   */
  async removePreference(userId: number, preference: string): Promise<User> {
    return this.userRepo.removePreference(userId, preference);
  }

  /**
   * Updates the entire preferences list for a user.
   * @param userId - The unique identifier of the user
   * @param preferences - The new list of preferences
   * @returns Promise<User> - The updated user object
   */
  async updatePreferences(userId: number, preferences: string[]): Promise<User> {
    return this.userRepo.updatePreferences(userId, preferences);
  }
  /**
   * Permanently deletes a user from the system.
   * @param id - The unique identifier of the user to delete
   * @throws Error if deletion fails
   */
  async delete(id: number): Promise<void> {
    try {
      this.logger.debug(LogMessages.USER_DELETE_ATTEMPT, id);
      await this.userRepo.delete(id);
      this.logger.log(LogMessages.USER_DELETE_SUCCESS, id);
    } catch (error) {
      this.logger.error(
        LogMessages.USER_DELETE_FAILED,
        error instanceof Error ? error.message : LogMessages.UNKNOWN_ERROR,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
  /**
   * Retrieves a user by their phone number.
   * @param phoneNumber - The phone number to search for
   * @returns Promise<User | null> - The found user or null if not found
   * @throws Error if retrieval fails
   */
  async findByPhone(phoneNumber: string): Promise<User | null> {
    try {
      this.logger.debug(LogMessages.USER_FETCH_ATTEMPT, `phone: ${phoneNumber}`);
      const user = await this.userRepo.findByPhone(phoneNumber);
      if (!user) {
        this.logger.warn(LogMessages.USER_NOT_FOUND, `phone: ${phoneNumber}`);
      } else {
        this.logger.log(LogMessages.USER_FETCH_SUCCESS, `phone: ${phoneNumber}`);
      }
      return user;
    } catch (error) {
      this.logger.error(
        LogMessages.USER_FETCH_FAILED,
        error instanceof Error ? error.message : LogMessages.UNKNOWN_ERROR,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
  * Retrieves a user by their phone number.
  * @param phoneNumber - The phone number to search for
  * @returns Promise<User | null> - The found user or null if not found
  * @throws Error if retrieval fails
  */
  async findByPhoneAndRole(phoneNumber: string, role: UserRole): Promise<User | null> {
    try {
      this.logger.debug(LogMessages.USER_FETCH_ATTEMPT, `phone: ${phoneNumber}`);
      const user = await this.userRepo.findByPhoneAndRole(phoneNumber, role);
      if (!user) {
        this.logger.warn(LogMessages.USER_NOT_FOUND, `phone: ${phoneNumber}`);
      } else {
        this.logger.log(LogMessages.USER_FETCH_SUCCESS, `phone: ${phoneNumber}`);
      }
      return user;
    } catch (error) {
      this.logger.error(
        LogMessages.USER_FETCH_FAILED,
        error instanceof Error ? error.message : LogMessages.UNKNOWN_ERROR,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Retrieves a user by their email address.
   * @param email - The email address to search for
   * @returns Promise<User | null> - The found user or null if not found
   * @throws Error if retrieval fails
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.debug(LogMessages.USER_FETCH_ATTEMPT, `email: ${email}`);
      const user = await this.userRepo.findByEmail(email);
      if (!user) {
        this.logger.warn(LogMessages.USER_NOT_FOUND, `email: ${email}`);
      } else {
        this.logger.log(LogMessages.USER_FETCH_SUCCESS, `email: ${email}`);
      }
      return user;
    } catch (error) {
      this.logger.error(
        LogMessages.USER_FETCH_FAILED,
        error instanceof Error ? error.message : LogMessages.UNKNOWN_ERROR,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
  /**
   * Updates a user's profile picture.
   * Handles file upload to S3 and updates user record.
   * @param userId - The unique identifier of the user
   * @param file - The image file to upload
   * @param folder - The S3 folder to store the image in
   * @returns Promise<{fileId: number, url: string}> - The file ID and presigned URL
   * @throws BusinessException if user not found or update fails
   */
  async updateProfilePicture(
    userId: number,
    file: Express.Multer.File,
    folder: string | undefined,
  ): Promise<{ fileId: number; url: string }> {
    try {
      const user = await this.findOne(userId);
      if (!user) {
        throw new BusinessException(LogMessages.USER_NOT_FOUND, 'USER_NOT_FOUND');
      }

      // 2. If user has existing profile picture, delete it
      // if (user.profile_picture) {
      //   await this.fileService.deleteFile(Number(user.profile_picture));
      // }
      // 3. Upload file and create record in one transaction
      const uploadedFile = await this.fileService.uploadFile(file, folder);
      // 4. Update user's profile picture directly using repository
      await this.userRepo.update(userId, { profile_picture: uploadedFile.id.toString() });

      // 5. Return presigned URL for immediate display
      const presignedUrl = await this.fileService.getPresignedUrl(uploadedFile.id);
      this.logger.log(`Profile picture updated for user ${userId}`);

      return {
        fileId: uploadedFile.id,
        url: presignedUrl,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update profile picture: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BusinessException(LogMessages.USER_UPDATE_FAILED, 'USER_UPDATE_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  /**
   * Retrieves the presigned URL for a user's profile picture.
   * @param userId - The unique identifier of the user
   * @returns Promise<string | null> - The presigned URL or null if no profile picture
   * @throws BusinessException if user not found or retrieval fails
   */
  async getProfilePictureUrl(userId: number): Promise<string | null> {
    try {
      const user = await this.findOne(userId);
      if (!user) {
        throw new BusinessException(LogMessages.USER_NOT_FOUND, 'USER_NOT_FOUND');
      }

      if (!user.profile_picture) {
        return null;
      }

      return this.fileService.getPresignedUrl(Number(user.profile_picture));
    } catch (error) {
      this.logger.error(
        `Failed to get profile picture URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BusinessException(LogMessages.USER_FETCH_FAILED, 'USER_FETCH_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
