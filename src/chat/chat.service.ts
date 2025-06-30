import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { UserService } from 'src/users/services/user.service';
import { Broadcast } from './entities/broadcast.entity';
import { BroadcastRecipient } from './entities/broadcast-recipient.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger('ChatService');

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Broadcast)
    private readonly broadcastRepository: Repository<Broadcast>,
    @InjectRepository(BroadcastRecipient)
    private readonly broadcastRecipientRepository: Repository<BroadcastRecipient>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly userService: UserService,
  ) {}

  async createMessage(
    contact: Contact,
    sender: User,
    messageType: MessageType,
    content?: string,
    mediaKey?: string,
  ): Promise<Message> {
    const newMessage = this.messageRepository.create({
      contact,
      sender,
      messageType,
      content,
      mediaKey,
    });
    return this.messageRepository.save(newMessage);
  }

  async getConversation(contactId: bigint): Promise<Message[]> {
    return this.messageRepository.find({
      where: { contactId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async createBroadcast({
    name,
    message,
    contactIds,
    senderId,
    media,
  }: {
    name: string;
    message: string;
    contactIds: number[];
    senderId: bigint;
    media: Express.Multer.File[];
  }): Promise<any> {
    this.logger.log('broadcast is creating with user', String(senderId));

    // 1. Validate sender
    const user = await this.userService.findOne(senderId);
    if (!user) {
      throw new UnauthorizedException(`User with ID ${senderId} not found`);
    }

    // 2. Create broadcast
    const broadcast = this.broadcastRepository.create({
      name,
      sellerId: senderId,
    });
    const savedBroadcast = await this.broadcastRepository.save(broadcast);

    // 3. Create recipients
    const recipients = contactIds.map(contactId =>
      this.broadcastRecipientRepository.create({
        broadcastId: savedBroadcast.id,
        customerId: BigInt(contactId),
      }),
    );
    await this.broadcastRecipientRepository.save(recipients);

    // 4. Send message to each contact (create Message entity)
    const mediaKey = media && media.length > 0 ? media[0].filename : undefined;
    const sentMessages: Message[] = [];
    for (const contactId of contactIds) {
      const msg = this.messageRepository.create({
        contactId: BigInt(contactId),
        senderId,
        messageType: mediaKey ? MessageType.IMAGE : MessageType.TEXT,
        content: message,
        mediaKey,
        broadcastId: savedBroadcast.id,
      });
      sentMessages.push(await this.messageRepository.save(msg));
    }

    return {
      success: true,
      broadcast: savedBroadcast,
      recipients: contactIds,
      messages: sentMessages,
    };
  }

  async getAllChatsForCurrentUser(userId: bigint, role: string): Promise<any[]> {
    // Find all contacts where the user is a participant
    const contacts = await this.contactRepository.find({
      where: [{ seller_id: userId }, { invited_user_id: userId }],
      relations: ['invited_user'],
      order: { updated_at: 'DESC' },
    });

    // For each contact, check if there are messages and count unread
    const result: User | { unreadMessagesCount: number }[] = [];
    for (const contact of contacts) {
      // Only include chats with at least one message
      const messageCount = await this.messageRepository.count({ where: { contactId: contact.id } });
      if (messageCount === 0) continue;

      // Count unread messages for this user (assuming Message has 'read' and 'senderId')
      const unreadMessagesCount = await this.messageRepository.count({
        where: {
          contactId: contact.id,
          read: false,
          // Unread for the user: not sent by the user
          senderId: contact.seller_id === userId ? contact.invited_user_id : contact.seller_id,
        },
      });

      result.push({
        ...contact.invited_user,
        unreadMessagesCount,
      });
    }
    return result;
  }

  async deleteChat(contactId: bigint): Promise<void> {
    // TODO: Implement logic to delete a chat
  }

  async getBroadcastsBySeller(sellerId: bigint): Promise<Broadcast[]> {
    return this.broadcastRepository.find({ where: { sellerId } });
  }
}
