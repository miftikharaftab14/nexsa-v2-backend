// RESPONSE INTERFACE
export interface TwilioVerifyServiceResponse {
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    success: boolean;
}


export interface InterfaceTwilioVerifyService {
    sendAVerificationToken(phoneNumber: string): Promise<TwilioVerifyServiceResponse>;
    checkTheVerificationToken(phoneNumber: string, code: string): Promise<TwilioVerifyServiceResponse>;

}