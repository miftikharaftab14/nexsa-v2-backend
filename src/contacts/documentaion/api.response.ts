import { HttpStatus } from '@nestjs/common';
import { ApiTypes } from 'src/common/enums/api-types.enum';
import { Examples } from 'src/common/enums/examples.enum';
import { Messages } from 'src/common/enums/messages.enum';
import { ContactStatus } from 'src/common/enums/contact-status.enum';

export const _200_contact = {
  status: HttpStatus.OK,
  description: Messages.CONTACT_FETCHED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.CONTACT_FETCHED },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.OK },
      data: {
        type: ApiTypes.OBJECT,
        properties: {
          id: { type: ApiTypes.NUMBER, example: Examples.CONTACT_ID },
          seller_id: { type: ApiTypes.NUMBER, example: Examples.USER_ID },
          invited_user_id: { type: ApiTypes.NUMBER, example: null },
          full_name: { type: ApiTypes.STRING, example: Examples.CONTACT_NAME },
          phone_number: { type: ApiTypes.STRING, example: Examples.PHONE },
          email: { type: ApiTypes.STRING, example: Examples.EMAIL },
          status: {
            type: ApiTypes.STRING,
            enum: Object.values(ContactStatus),
            example: ContactStatus.NEW,
          },
          created_at: { type: ApiTypes.STRING, example: Examples.CREATED_AT },
          updated_at: { type: ApiTypes.STRING, example: Examples.UPDATED_AT },
        },
      },
    },
  },
};

export const _200_contacts = {
  status: HttpStatus.OK,
  description: Messages.CONTACTS_FETCHED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.CONTACTS_FETCHED },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.OK },
      data: {
        type: ApiTypes.ARRAY,
        items: {
          type: ApiTypes.OBJECT,
          properties: {
            id: { type: ApiTypes.NUMBER, example: Examples.CONTACT_ID },
            seller_id: { type: ApiTypes.NUMBER, example: Examples.USER_ID },
            invited_user_id: { type: ApiTypes.NUMBER, example: null },
            full_name: { type: ApiTypes.STRING, example: Examples.CONTACT_NAME },
            phone_number: { type: ApiTypes.STRING, example: Examples.PHONE },
            email: { type: ApiTypes.STRING, example: Examples.EMAIL },
            status: {
              type: ApiTypes.STRING,
              enum: Object.values(ContactStatus),
              example: ContactStatus.NEW,
            },
            created_at: { type: ApiTypes.STRING, example: Examples.CREATED_AT },
            updated_at: { type: ApiTypes.STRING, example: Examples.UPDATED_AT },
          },
        },
      },
    },
  },
};

export const _201_contact = {
  status: HttpStatus.CREATED,
  description: Messages.CONTACT_CREATED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.CONTACT_CREATED },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.CREATED },
      data: {
        type: ApiTypes.OBJECT,
        properties: {
          id: { type: ApiTypes.NUMBER, example: Examples.CONTACT_ID },
          seller_id: { type: ApiTypes.NUMBER, example: Examples.USER_ID },
          invited_user_id: { type: ApiTypes.NUMBER, example: null },
          full_name: { type: ApiTypes.STRING, example: Examples.CONTACT_NAME },
          phone_number: { type: ApiTypes.STRING, example: Examples.PHONE },
          email: { type: ApiTypes.STRING, example: Examples.EMAIL },
          status: {
            type: ApiTypes.STRING,
            enum: Object.values(ContactStatus),
            example: ContactStatus.NEW,
          },
          created_at: { type: ApiTypes.STRING, example: Examples.CREATED_AT },
          updated_at: { type: ApiTypes.STRING, example: Examples.UPDATED_AT },
        },
      },
    },
  },
};
export const _400_contact = {
  status: HttpStatus.BAD_REQUEST,
  description: Messages.INVALID_INPUT,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: false },
      message: { type: ApiTypes.STRING, example: Messages.INVALID_INPUT },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.BAD_REQUEST },
      error: { type: ApiTypes.STRING, example: 'VALIDATION_ERROR' },
    },
  },
};
export const _404_contact = {
  status: HttpStatus.NOT_FOUND,
  description: Messages.CONTACT_NOT_FOUND,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: false },
      message: { type: ApiTypes.STRING, example: Messages.CONTACT_NOT_FOUND },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.NOT_FOUND },
      error: { type: ApiTypes.STRING, example: 'CONTACT_NOT_FOUND' },
    },
  },
};
