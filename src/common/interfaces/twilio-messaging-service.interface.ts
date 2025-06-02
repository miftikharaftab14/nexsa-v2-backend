// RESPONSE INTERFACE
export interface TwilioMessagingServiceResponse {
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    success: boolean;
}


export interface InterfaceTwilioMessagingService {
    sendSMSWithMessagingService(phoneNumber: string, messageBody: string): Promise<TwilioMessagingServiceResponse>;
}