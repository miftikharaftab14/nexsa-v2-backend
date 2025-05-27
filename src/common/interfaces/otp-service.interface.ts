import { OtpPurpose } from '../enums/otp.enum';

export interface OtpServiceResponse {
  success: boolean;
  message: string;
  otp?: string;
}

export interface IOtpService {
  sendOtp(phoneNumber: string, purpose?: OtpPurpose): Promise<OtpServiceResponse>;
  verifyOtp(phoneNumber: string, code: string, purpose?: OtpPurpose): Promise<boolean>;
  resendOtp(phoneNumber: string, purpose?: OtpPurpose): Promise<OtpServiceResponse>;
}
