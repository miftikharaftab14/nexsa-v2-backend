import { HttpStatus } from '@nestjs/common';
import { ApiTypes } from 'src/common/enums/api-types.enum';
import { Examples } from 'src/common/enums/examples.enum';
import { Messages } from 'src/common/enums/messages.enum';

export const _201_signup = {
  status: HttpStatus.CREATED,
  description: Messages.USER_REGISTERED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.USER_REGISTERED },
      data: {
        type: ApiTypes.OBJECT,
        properties: {
          id: { type: ApiTypes.NUMBER, example: Examples.USER_ID },
          username: { type: ApiTypes.STRING, example: Examples.USERNAME },
          email: { type: ApiTypes.STRING, example: Examples.EMAIL },
          phone_number: { type: ApiTypes.STRING, example: Examples.PHONE },
          role: { type: ApiTypes.STRING, example: Examples.CUSTOMER },
        },
      },
    },
  },
};

export const _400_signnup = {
  status: HttpStatus.BAD_REQUEST,
  description: Messages.EMAIL_ALREADY_EXISTS,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: false },
      message: { type: ApiTypes.STRING, example: Messages.EMAIL_ALREADY_EXISTS },
      error: {
        type: ApiTypes.OBJECT,
        properties: {
          code: { type: ApiTypes.STRING, example: Examples.EMAIL_ALREADY_EXISTS },
          details: {
            type: ApiTypes.OBJECT,
            properties: {
              email: { type: ApiTypes.STRING, example: Examples.EMAIL },
            },
          },
        },
      },
    },
  },
};

export const _200_login = {
  status: HttpStatus.OK,
  description: Messages.OTP_SENT,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.OTP_SENT },
      data: {
        type: ApiTypes.OBJECT,
        properties: {
          message: { type: ApiTypes.STRING, example: Messages.OTP_SENT },
          otp: { type: ApiTypes.STRING, example: Examples.OTP_CODE },
        },
      },
    },
  },
};

export const _400_login = {
  status: HttpStatus.BAD_REQUEST,
  description: Messages.USER_NOT_FOUND,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: false },
      message: { type: ApiTypes.STRING, example: Messages.USER_NOT_FOUND },
      error: {
        type: ApiTypes.OBJECT,
        properties: {
          code: { type: ApiTypes.STRING, example: Examples.USER_NOT_FOUND },
          details: {
            type: ApiTypes.OBJECT,
            properties: {
              phone_number: { type: ApiTypes.STRING, example: Examples.PHONE },
            },
          },
        },
      },
    },
  },
};

export const _200_verifyOtp = {
  status: HttpStatus.OK,
  description: Messages.OTP_VERIFIED,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: Messages.OTP_VERIFIED },
      data: {
        type: ApiTypes.OBJECT,
        properties: {
          accessToken: { type: ApiTypes.STRING, example: Examples.JWT_TOKEN },
          user: {
            type: ApiTypes.OBJECT,
            properties: {
              id: { type: ApiTypes.NUMBER, example: Examples.USER_ID },
              username: { type: ApiTypes.STRING, example: Examples.USERNAME },
              email: { type: ApiTypes.STRING, example: Examples.EMAIL },
              phone_number: { type: ApiTypes.STRING, example: Examples.PHONE },
              role: { type: ApiTypes.STRING, example: Examples.CUSTOMER },
            },
          },
        },
      },
    },
  },
};

export const _400_verifyOtp = {
  status: HttpStatus.BAD_REQUEST,
  description: Messages.INVALID_OTP,
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: false },
      message: { type: ApiTypes.STRING, example: Messages.INVALID_OTP },
      error: {
        type: ApiTypes.OBJECT,
        properties: {
          code: { type: ApiTypes.STRING, example: Examples.INVALID_OTP },
          details: {
            type: ApiTypes.OBJECT,
            properties: {
              phone_number: { type: ApiTypes.STRING, example: Examples.PHONE },
            },
          },
        },
      },
    },
  },
};

export const _200_resendOtp = {
  status: HttpStatus.OK,
  description: 'OTP has been resent successfully.',
  schema: {
    type: ApiTypes.OBJECT,
    properties: {
      success: { type: ApiTypes.BOOLEAN, example: true },
      message: { type: ApiTypes.STRING, example: 'OTP resent successfully.' },
      data: {
        type: ApiTypes.OBJECT,
        properties: {
          resendTimeout: {
            type: ApiTypes.NUMBER,
            example: 60,
            description: 'Seconds until next resend allowed',
          },
        },
        example: {
          resendTimeout: 60,
        },
      },
    },
  },
};
