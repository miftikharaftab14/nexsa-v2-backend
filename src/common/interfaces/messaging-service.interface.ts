export interface IMessagingService {
  sendMessage(to: string, message: string): Promise<void>;
}
