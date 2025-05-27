import { HttpStatus } from '@nestjs/common';
import { ApiTypes } from 'src/common/enums/api-types.enum';
import { Examples } from 'src/common/enums/examples.enum';
import { Messages } from 'src/common/enums/messages.enum';
import { UserRole } from 'src/common/enums/user-role.enum';

export const _200_users = {
  status: HttpStatus.OK,
  description: Messages.USERS_FETCHED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.USERS_FETCHED },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.OK },
      data: {
        type: ApiTypes.ARRAY,
        items: {
          type: ApiTypes.OBJECT,
          properties: {
            id: { type: ApiTypes.NUMBER, example: Examples.USER_ID },
            username: { type: ApiTypes.STRING, example: Examples.USERNAME },
            email: { type: ApiTypes.STRING, example: Examples.EMAIL },
            phone_number: { type: ApiTypes.STRING, example: Examples.PHONE },
            role: { type: ApiTypes.STRING, example: UserRole.CUSTOMER },
            profile_picture: { type: ApiTypes.STRING, example: null },
            about_me: { type: ApiTypes.STRING, example: null },
            is_deleted: { type: ApiTypes.BOOLEAN, example: false },
            created_at: { type: ApiTypes.STRING, example: Examples.CREATED_AT },
            updated_at: { type: ApiTypes.STRING, example: Examples.UPDATED_AT },
          },
        },
      },
    },
  },
};

export const _201_users = {
  status: HttpStatus.CREATED,
  description: Messages.USER_CREATED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.USER_CREATED },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.CREATED },
      data: {
        type: ApiTypes.OBJECT,
        properties: {
          id: { type: ApiTypes.NUMBER, example: Examples.USER_ID },
          username: { type: ApiTypes.STRING, example: Examples.USERNAME },
          email: { type: ApiTypes.STRING, example: Examples.EMAIL },
          phone_number: { type: ApiTypes.STRING, example: Examples.PHONE },
          role: { type: ApiTypes.STRING, example: UserRole.CUSTOMER },
          profile_picture: { type: ApiTypes.STRING, example: null },
          about_me: { type: ApiTypes.STRING, example: null },
          is_deleted: { type: ApiTypes.BOOLEAN, example: false },
          created_at: { type: ApiTypes.STRING, example: Examples.CREATED_AT },
          updated_at: { type: ApiTypes.STRING, example: Examples.UPDATED_AT },
        },
      },
    },
  },
};

export const _400_users = {
  status: HttpStatus.BAD_REQUEST,
  description: Messages.INVALID_INPUT,
};

export const _401_users = {
  status: HttpStatus.UNAUTHORIZED,
  description: Messages.UNAUTHORIZED,
};

export const _403_users = {
  status: HttpStatus.FORBIDDEN,
  description: Messages.FORBIDDEN,
};

export const _404_users = {
  status: HttpStatus.NOT_FOUND,
  description: Messages.USER_NOT_FOUND,
};

export const _200_user_delete = {
  status: HttpStatus.OK,
  description: Messages.USER_DELETED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.USER_DELETED },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.OK },
      data: { type: ApiTypes.NULL, example: null },
    },
  },
};

export const _200_profile_picture = {
  status: HttpStatus.OK,
  description: Messages.PROFILE_PICTURE_UPDATED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.PROFILE_PICTURE_UPDATED },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.OK },
      data: {
        type: ApiTypes.OBJECT,
        properties: {
          fileId: {
            type: ApiTypes.NUMBER,
            description: 'ID of the uploaded file',
            example: Examples.FILE_ID,
          },
          url: {
            type: ApiTypes.STRING,
            description: 'Presigned URL for accessing the uploaded file',
            example: Examples.PRESIGNED_URL,
          },
        },
      },
    },
  },
};

export const _400_profile_picture = {
  status: HttpStatus.BAD_REQUEST,
  description: Messages.INVALID_FILE_TYPE,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: false },
      message: { type: ApiTypes.STRING, example: Messages.INVALID_FILE_TYPE },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.BAD_REQUEST },
      data: { type: ApiTypes.NULL, example: null },
    },
  },
};

export const _404_profile_picture = {
  status: HttpStatus.NOT_FOUND,
  description: Messages.USER_NOT_FOUND,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: false },
      message: { type: ApiTypes.STRING, example: Messages.USER_NOT_FOUND },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.NOT_FOUND },
      data: { type: ApiTypes.NULL, example: null },
    },
  },
};
