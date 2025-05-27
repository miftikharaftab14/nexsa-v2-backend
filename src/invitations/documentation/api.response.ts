import { HttpStatus } from '@nestjs/common';
import { ApiTypes } from 'src/common/enums/api-types.enum';
import { InvitationMethod, InvitationStatus } from 'src/common/enums/contact-invitation.enum';
import { Examples } from 'src/common/enums/examples.enum';
import { Messages } from 'src/common/enums/messages.enum';

export const _200_invitation = {
  status: HttpStatus.OK,
  description: Messages.INVITATION_FETCHED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.INVITATION_FETCHED },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.OK },
      data: {
        type: ApiTypes.OBJECT,
        properties: {
          id: { type: ApiTypes.NUMBER, example: Examples.INVITATION_ID },
          contact_id: { type: ApiTypes.NUMBER, example: Examples.CONTACT_ID },
          invite_token: { type: ApiTypes.STRING, example: Examples.INVITATION_TOKEN },
          method: {
            type: ApiTypes.STRING,
            enum: Object.values(InvitationMethod),
            example: InvitationMethod.SMS,
          },
          invite_sent_at: { type: ApiTypes.STRING, example: Examples.CREATED_AT },
          invite_cancelled_at: { type: ApiTypes.STRING, example: null },
          invite_accepted_at: { type: ApiTypes.STRING, example: null },
          status: {
            type: ApiTypes.STRING,
            enum: Object.values(InvitationStatus),
            example: InvitationStatus.PENDING,
          },
          created_at: { type: ApiTypes.STRING, example: Examples.CREATED_AT },
        },
      },
    },
  },
};

export const _200_invitations = {
  status: HttpStatus.OK,
  description: Messages.INVITATIONS_FETCHED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.INVITATIONS_FETCHED },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.OK },
      data: {
        type: ApiTypes.ARRAY,
        items: {
          type: ApiTypes.OBJECT,
          properties: {
            id: { type: ApiTypes.NUMBER, example: Examples.INVITATION_ID },
            contact_id: { type: ApiTypes.NUMBER, example: Examples.CONTACT_ID },
            invite_token: { type: ApiTypes.STRING, example: Examples.INVITATION_TOKEN },
            method: {
              type: ApiTypes.STRING,
              enum: Object.values(InvitationMethod),
              example: InvitationMethod.SMS,
            },
            invite_sent_at: { type: ApiTypes.STRING, example: Examples.CREATED_AT },
            invite_cancelled_at: { type: ApiTypes.STRING, example: null },
            invite_accepted_at: { type: ApiTypes.STRING, example: null },
            status: {
              type: ApiTypes.STRING,
              enum: Object.values(InvitationStatus),
              example: InvitationStatus.PENDING,
            },
            created_at: { type: ApiTypes.STRING, example: Examples.CREATED_AT },
            contact: {
              type: ApiTypes.OBJECT,
              properties: {
                id: { type: ApiTypes.NUMBER, example: Examples.CONTACT_ID },
                seller: {
                  type: ApiTypes.OBJECT,
                  properties: {
                    id: { type: ApiTypes.NUMBER, example: Examples.USER_ID },
                    full_name: { type: ApiTypes.STRING, example: Examples.USERNAME },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
export const _404_invitation = {
  status: HttpStatus.NOT_FOUND,
  description: Messages.INVITATION_NOT_FOUND,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: false },
      message: { type: ApiTypes.STRING, example: Messages.INVITATION_NOT_FOUND },
      status: { type: ApiTypes.NUMBER, example: HttpStatus.NOT_FOUND },
      error: { type: ApiTypes.STRING, example: 'INVITATION_NOT_FOUND' },
    },
  },
};
export const _400_invitation = {
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
