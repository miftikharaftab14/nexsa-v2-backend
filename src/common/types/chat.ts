import { Message, MessageType } from 'src/chat/entities/message.entity';
import { User } from 'src/users/entities/user.entity';

export enum ChatType {
  BROADCAST = 'broadcast',
  CHAT = 'chat',
}

export interface BroadcastCustomer {
  customer_id: number;
  customer_username: string | null;
  customer_profile_picture: number | null;
  recipient_deleted_at: string | null;
}

export interface TransformedCustomer {
  id: number;
  name: string | null;
  profile_picture: string | null;
}

export interface BroadcastResult {
  broadcast_id: number;
  broadcast_seller_id: string;
  broadcast_name: string;
  broadcast_created_at: Date;
  broadcast_updated_at: Date;
  broadcast_deleted_at: Date | null;
  total_recipients_count: string; // Because it's returned as a string by COUNT
  customers: BroadcastCustomer[];
}

export interface TransformedBroadcast {
  id: number;
  seller_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  totalRecipientsCount: number;
  customers: TransformedCustomer[];
  type?: ChatType;
  lastMessageAt: string | null;
}
export type ChatResult = {
  unreadMessagesCount: number;
  contactId: bigint;
  profile_picture: string;
  username: string;
  phone_number: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  read: boolean;
  type?: ChatType;
  messageType?: MessageType;
  sender?: User;
  message: Message | null;
  mediaCont?: {
    mediaUrl: string | null;
    thumbnailUrl: string | null;
  };
};
