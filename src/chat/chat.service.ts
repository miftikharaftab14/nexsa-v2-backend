import { Inject, Injectable, Logger, UnauthorizedException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Message, MessageType } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { UserService } from 'src/users/services/user.service';
import { Broadcast } from './entities/broadcast.entity';
import { BroadcastRecipient } from './entities/broadcast-recipient.entity';
import { InjectionToken } from 'src/common/constants/injection-tokens';
import { FileService } from 'src/files/services/file.service';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { File } from 'src/files/entities/file.entity';
import { ChatGateway } from './chat.gateway';

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
    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: FileService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}
  async convertUrls(msgs: Message[]) {
    return await Promise.all(
      msgs.map(async msg => ({
        ...msg,
        mediaCont: {
          mediaUrl: await this.fileService.getPresignedUrl(msg.mediaKey),
          thumbnailUrl: await this.fileService.getThumbnailPresignedUrl(msg.mediaKey),
        },
      })),
    );
  }
  async createMessage(
    contact: Contact,
    sender: User,
    messageType: MessageType,
    content?: string,
    mediaKey?: number,
    broadcastId?: number,
  ): Promise<Message> {
    const newMessage = this.messageRepository.create({
      contact,
      sender,
      messageType,
      content,
      mediaKey,
      broadcastId,
    });
    return this.messageRepository.save(newMessage);
  }

  async getConversation(contactId: bigint): Promise<Message[]> {
    const messages = await this.messageRepository.find({
      where: { contactId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
    return this.convertUrls(messages);
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
  }): Promise<ApiResponse<Broadcast>> {
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
    const recipients = await Promise.all(
      contactIds.map(async contactId => {
        const contact = await this.contactRepository.findOne({ where: { id: BigInt(contactId) } });
        return this.broadcastRecipientRepository.create({
          broadcastId: savedBroadcast.id,
          customerId: contact?.invited_user_id,
        });
      }),
    );
    await this.broadcastRecipientRepository.save(recipients);
    let mediaUploaded: File[] = [];
    if (media && media.length > 0) {
      mediaUploaded = await Promise.all(
        media.map(async file => await this.fileService.uploadFile(file, 'chat-media')),
      );
    }

    // 4. Send message to each contact (create Message entity)
    const sentMessages: Message[] = [];

    for (const contactId of contactIds) {
      const bigContactId = BigInt(contactId);
      const messagesToSave: Message[] = [];

      // 1. Add media messages (if any)
      if (mediaUploaded.length > 0) {
        messagesToSave.push(
          ...mediaUploaded.map(obj =>
            this.messageRepository.create({
              contactId: bigContactId,
              senderId,
              messageType: MessageType.IMAGE,
              mediaKey: obj.id,
              broadcastId: savedBroadcast.id,
            }),
          ),
        );
      }

      // 2. Add text message (if present)
      if (message?.trim()) {
        messagesToSave.push(
          this.messageRepository.create({
            contactId: bigContactId,
            senderId,
            messageType: MessageType.TEXT,
            content: message,
            broadcastId: savedBroadcast.id,
          }),
        );
      }

      // 3. Save all messages for this contact in parallel
      const saved = await Promise.all(messagesToSave.map(msg => this.messageRepository.save(msg)));

      // Emit each message to the recipient via socket
      for (const savedMsg of saved) {
        // Find the recipient userId for this contact
        const contact = await this.contactRepository.findOne({ where: { id: bigContactId } });
        if (!contact) continue;
        const receiverId =
          senderId === contact.seller_id ? contact.invited_user_id : contact.seller_id;
        await this.chatGateway.emitMessageToUser(receiverId, savedMsg);
      }

      sentMessages.push(...saved);
    }

    return {
      success: true,
      message: 'broadcast created successfully',
      status: 200,
      data: savedBroadcast,
    };
  }

  async getAllChatsForCurrentUser(userId: bigint): Promise<any[]> {
    const contacts = await this.contactRepository.find({
      where: [{ seller_id: userId }, { invited_user_id: userId }],
      relations: ['invited_user'],
      order: { updated_at: 'DESC' },
    });

    const result: {
      unreadMessagesCount: number;
      contactId: bigint;
      profile_picture: string;
      username: string;
      phone_number: string;
      lastMessage: string | null;
      lastMessageAt: Date | null;
      read: boolean;
    }[] = [];

    for (const contact of contacts) {
      const messageCount = await this.messageRepository.count({
        where: { contactId: contact.id },
      });
      if (messageCount === 0) continue;

      const unreadMessagesCount = await this.messageRepository.count({
        where: {
          contactId: contact.id,
          read: false,
          senderId: contact.seller_id === userId ? contact.invited_user_id : contact.seller_id,
        },
      });

      // Fetch the last message
      const lastMessage = await this.messageRepository.findOne({
        where: { contactId: contact.id },
        order: { createdAt: 'DESC' },
      });
      const { full_name } = contact;
      const { profile_picture, phone_number } = contact.invited_user;

      result.push({
        username: full_name,
        phone_number,
        profile_picture: profile_picture
          ? await this.fileService.getPresignedUrl(Number(profile_picture), 3600)
          : '',
        contactId: contact.id,
        unreadMessagesCount,
        lastMessage: lastMessage?.content ?? null,
        read: lastMessage?.read ?? false,
        lastMessageAt: lastMessage?.createdAt ?? null,
      });
    }

    return result;
  }

  async deleteChat(contactId: bigint): Promise<void> {
    await this.messageRepository.softDelete({ contactId });
  }

  async getBroadcastsBySeller(sellerId: bigint) {
    const { entities } = await this.broadcastRepository
      .createQueryBuilder('broadcast')
      .leftJoinAndSelect('broadcast.recipients', 'recipient')
      .leftJoinAndSelect('recipient.customer', 'user')
      .leftJoin(
        'contacts',
        'contact',
        `(
          (contact.invited_user_id = recipient.customerId AND contact.seller_id = broadcast.sellerId)
          OR
          (contact.seller_id = recipient.customerId AND contact.invited_user_id = broadcast.sellerId)
        )`,
      )
      .addSelect([
        'contact.id AS contact_id',
        'recipient.customerId AS customer_id_debug',
        'broadcast.sellerId AS seller_id_debug',
      ])
      .where('broadcast.sellerId = :sellerId', { sellerId })
      .getRawAndEntities();

    return entities;
  }
  async getBroadcastsById(broadcastId: number) {
    // Fetch the broadcast with recipients and their user info
    const broadcast = await this.broadcastRepository.findOne({
      where: { id: broadcastId },
      relations: ['recipients', 'recipients.customer', 'seller'],
    });
    if (!broadcast || !broadcast.recipients?.length) {
      return { broadcast, messages: [] };
    }

    // Pick the first recipient
    const recipient = broadcast.recipients[0];

    // Find the contact between seller and this recipient
    const contact = await this.contactRepository.findOne({
      where: [
        { seller_id: broadcast.sellerId, invited_user_id: recipient.customerId },
        { seller_id: recipient.customerId, invited_user_id: broadcast.sellerId },
      ],
    });
    if (!contact) {
      return { broadcast, messages: [] };
    }

    // Fetch all messages for this contact and this broadcast
    let messages = await this.messageRepository.find({
      where: { contactId: contact.id, broadcastId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
    messages = await this.convertUrls(messages);

    return { broadcast, messages };
  }
  async deleteBroadcastsBySeller(id: number): Promise<UpdateResult> {
    return this.broadcastRepository.softDelete({ id });
  }
  async getBroadcastContactIds(broadcastId: number): Promise<number[]> {
    // Get the broadcast to know the sellerId
    const broadcast = await this.broadcastRepository.findOne({ where: { id: broadcastId } });
    if (!broadcast) return [];

    // Find all contacts that match the recipient users for this broadcast
    const contacts: { contact_id: bigint }[] = await this.contactRepository
      .createQueryBuilder('contact')
      .innerJoin(
        'broadcast_recipients',
        'recipient',
        `
          recipient.broadcast_id = :broadcastId AND (
            (contact.seller_id = :sellerId AND contact.invited_user_id = recipient.customer_id)
            OR
            (contact.invited_user_id = :sellerId AND contact.seller_id = recipient.customer_id)
          )
        `,
        { broadcastId, sellerId: broadcast.sellerId.toString() },
      )
      .select('contact.id', 'contact_id')
      .getRawMany();

    return contacts.map(r => Number(r.contact_id));
  }
}
