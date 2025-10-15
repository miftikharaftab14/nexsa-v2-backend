import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, MoreThan, Repository, UpdateResult } from 'typeorm';
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
import { StoredFile } from 'src/files/types/storedFile';
import {
  BroadcastResult,
  ChatResult,
  ChatType,
  TransformedBroadcast,
  TransformedCustomer,
} from 'src/common/types/chat';
import { BulkDeleteDto, DeleteType } from './dto/deleteBulkDto.dto';
import { DeletedChat } from './entities/deleted-chat.entity';
import { BlocksService } from 'src/blocks/blocks.service';

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
    private readonly dataSource: DataSource,
    @InjectRepository(DeletedChat)
    private readonly deleteChatRepository: Repository<DeletedChat>,
    private readonly blocksService: BlocksService,
  ) { }
  async convertUrls(msgs: Message[]) {
    return await Promise.all(
      msgs.map(async msg => ({
        ...msg,
        createdAt: msg.createdAt.toString(),
        updatedAt: msg.updatedAt.toString(),
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

  async getConversation(contactId: bigint, userId: bigint) {
    const lastDelete = await this.deleteChatRepository.findOne({
      where: { contactId: contactId.toString(), userId: userId.toString() },
      order: { createdAt: 'DESC' },
    });

    const whereCondition: FindOptionsWhere<Message> = {
      contactId,
    };

    if (lastDelete) {
      whereCondition.createdAt = MoreThan(lastDelete.createdAt);
    }

    const messages = await this.messageRepository.find({
      where: whereCondition,
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
    media?: StoredFile[];
  }): Promise<ApiResponse<Broadcast>> {
    try {
      this.logger.log('broadcast is creating with user', String(senderId));

      return await this.dataSource.transaction(async manager => {
        // 1. Validate sender
        const user = await this.userService.findOne(senderId);
        if (!user) {
          throw new UnauthorizedException(`User with ID ${senderId} not found`);
        }

        // 2. Create broadcast
        const broadcast = this.broadcastRepository.create({ name, sellerId: senderId });
        const savedBroadcast = await manager.save(broadcast);
        // 3. Create recipients
        const recipients = await Promise.all(
          contactIds.map(async contactId => {
            this.logger.log(`contact fetching start ${contactId} type ${typeof contactId}`);
            const contact = await this.contactRepository.findOne({
              where: { id: BigInt(contactId) },
            });
            return this.broadcastRecipientRepository.create({
              broadcastId: savedBroadcast.id,
              customerId: contact?.invited_user_id,
            });
          }),
        );
        await manager.save(recipients);

        // 4. Upload media (outside the DB transaction, but handled in parallel)
        let mediaUploaded: File[] = [];
        if (media && media.length > 0) {
          mediaUploaded = await Promise.all(
            media.map(async file => await this.fileService.storeUploadedFile(file)),
          );
        }

        // 5. Send message to each contact
        const sentMessages: Message[] = [];

        for (const contactId of contactIds) {
          const bigContactId = BigInt(contactId);
          const messagesToSave: Message[] = [];

          // Media messages
          if (mediaUploaded.length > 0) {
            messagesToSave.push(
              ...mediaUploaded.map(obj =>
                this.messageRepository.create({
                  contactId: bigContactId,
                  senderId,
                  messageType: obj.mimeType.startsWith('video/')
                    ? MessageType.VIDEO
                    : obj.mimeType.startsWith('image/')
                      ? MessageType.IMAGE
                      : MessageType.FILE,
                  mediaKey: obj.id,
                  broadcastId: savedBroadcast.id,
                }),
              ),
            );
          }

          // Text message
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

          // Save messages
          const saved = await Promise.all(
            messagesToSave.map(msg => manager.save(msg)), // Save using transactional manager
          );

          // Emit via socket (non-transactional part)
          for (const savedMsg of saved) {
            const contact = await this.contactRepository.findOne({ where: { id: bigContactId } });
            if (!contact) continue;
            const receiverId =
              senderId === contact.seller_id ? contact.invited_user_id : contact.seller_id;
            await this.chatGateway.emitMessageToUser(
              contact.id,
              receiverId,
              user,
              contact,
              savedMsg,
              savedMsg.mediaKey ? await this.fileService.getPresignedUrl(savedMsg.mediaKey) : null,
            );
          }

          sentMessages.push(...saved);
        }

        return {
          success: true,
          message: 'broadcast created successfully',
          status: 200,
          data: savedBroadcast,
        };
      });
    } catch (error) {
      this.logger.log('Error in creation of broadcast');
      console.log(error);
      throw Error(error);
    }
  }

  async getAllChatsForCurrentUser(userId: bigint): Promise<any[]> {
    const currentUser = await this.userService.findOne(userId);
    if (!currentUser) {
      throw new NotFoundException(`user with userId: ${currentUser} is not found`);
    }
    if (currentUser.is_deleted) {
      throw new BadRequestException(`Record with ID ${userId} is not available due to deletion`);
    }
    const contacts = await this.contactRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.seller', 'seller')
      .leftJoinAndSelect('contact.invited_user', 'invited_user')
      .where(
        '(contact.seller_id = :userId AND seller.is_deleted = false AND invited_user.is_deleted = false) ' +
        'OR (contact.invited_user_id = :userId AND invited_user.is_deleted = false AND seller.is_deleted = false)',
        { userId },
      )
      .orderBy('contact.updated_at', 'DESC')
      .getMany();
    console.log({ contacts: JSON.stringify(contacts) });

    const result: {
      unreadMessagesCount: number;
      contactId: bigint;
      profile_picture: string;
      username: string;
      phone_number: string;
      lastMessage: string | null;
      lastMessageAt: string | null;
      messageType?: MessageType;
      read: boolean;
      message: Message | null;
      is_deleted: boolean;
      isBlocked: boolean;
      sellerId: string | null;
    }[] = [];

    for (const contact of contacts) {
      // Check if either party has blocked the other
      const otherUserId = contact.seller_id === userId ? contact.invited_user_id : contact.seller_id;
      const isCurrentUserBlockedOther = await this.blocksService.isBlocked(userId, otherUserId);
      let isBlocked = false
      let sellerId = String(otherUserId)
      if (isCurrentUserBlockedOther) {
        isBlocked = true
      }

      const lastDelete = await this.deleteChatRepository.findOne({
        where: {
          contactId: contact.id.toString(),
          userId: userId.toString(),
        },
        order: { createdAt: 'DESC' },
      });

      const messageWhere: any = { contactId: contact.id };
      const unreadWhere: any = {
        contactId: contact.id,
        read: false,
        senderId: contact.seller_id === userId ? contact.invited_user_id : contact.seller_id,
      };
      const lastMessageWhere: any = { contactId: contact.id };

      if (lastDelete?.createdAt) {
        messageWhere.createdAt = MoreThan(lastDelete.createdAt);
        unreadWhere.createdAt = MoreThan(lastDelete.createdAt);
        lastMessageWhere.createdAt = MoreThan(lastDelete.createdAt);
      }

      const messageCount = await this.messageRepository.count({ where: messageWhere });
      if (messageCount === 0) continue;

      const unreadMessagesCount = await this.messageRepository.count({ where: unreadWhere });

      const lastMessage = await this.messageRepository.findOne({
        where: lastMessageWhere,
        order: { createdAt: 'DESC' },
      });

      const { profile_picture, phone_number, username } = contact.seller;

      result.push({
        username,
        phone_number,
        profile_picture: profile_picture
          ? await this.fileService.getPresignedUrl(Number(profile_picture), 3600)
          : '',
        contactId: contact.id,
        unreadMessagesCount,
        lastMessage: lastMessage?.content ?? null,
        read: lastMessage?.read ?? false,
        lastMessageAt: lastMessage?.createdAt?.toISOString() ?? null,
        messageType: lastMessage?.messageType,
        message: lastMessage,
        is_deleted: contact.seller.is_deleted,
        isBlocked,
        sellerId,
      });
    }

    return result;
  }

  async getBulkChatsForCurrentUser(userId: bigint): Promise<(ChatResult | TransformedBroadcast)[]> {
    const currentUser = await this.userService.findOne(userId);
    if (!currentUser) {
      throw new NotFoundException(`user with userId: ${currentUser} is not found`);
    }
    if (currentUser.is_deleted) {
      throw new BadRequestException(`Record with ID ${userId} is not available due to deletion`);
    }
    const [contacts, broadcastsRaw] = await Promise.all([
      this.contactRepository.find({
        where: [
          { seller_id: userId, seller: { is_deleted: false }, invited_user: { is_deleted: false } },
          {
            invited_user_id: userId,
            invited_user: { is_deleted: false },
            seller: { is_deleted: false },
          },
        ],
        relations: ['invited_user', 'seller'],
        order: { updated_at: 'DESC' },
      }),
      this.dataSource
        .createQueryBuilder()
        .select('broadcast.id', 'broadcast_id')
        .addSelect('broadcast.seller_id', 'broadcast_seller_id')
        .addSelect('broadcast.name', 'broadcast_name')
        .addSelect('broadcast.created_at', 'broadcast_created_at')
        .addSelect('broadcast.updated_at', 'broadcast_updated_at')
        .addSelect('broadcast.deleted_at', 'broadcast_deleted_at')
        .addSelect(
          `COUNT(DISTINCT CASE WHEN customer.is_deleted = false THEN recipient.customer_id END)`,
          'total_recipients_count',
        )
        .addSelect(
          `COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'customer_id', customer.id,
              'customer_username', customer.username,
              'customer_profile_picture', customer.profile_picture,
              'recipient_deleted_at', recipient.deleted_at
            )
          ) FILTER (WHERE customer.id IS NOT NULL),
          '[]'
        )`,
          'customers',
        )
        .from(Broadcast, 'broadcast')
        .leftJoin('broadcast.recipients', 'recipient')
        .leftJoin('recipient.customer', 'customer', 'customer.is_deleted = false')
        .groupBy('broadcast.id')
        .where('broadcast.seller_id = :sellerId', { sellerId: userId.toString() })
        .orderBy('broadcast.id', 'DESC')
        .getRawMany(),
    ]);

    const chats: ChatResult[] = [];

    for (const contact of contacts) {
      // Check if either party has blocked the other
      const otherUserId = contact.seller_id === userId ? contact.invited_user_id : contact.seller_id;
      const isCurrentUserBlockedOther = await this.blocksService.isBlocked(userId, otherUserId);
      let isBlocked = false
      if (isCurrentUserBlockedOther) {
        isBlocked = true
      }

      const lastDelete = await this.deleteChatRepository.findOne({
        where: {
          contactId: contact.id.toString(),
          userId: userId.toString(),
        },
        order: { createdAt: 'DESC' },
      });

      this.logger.log(
        ` deleted chat data contactId:${contact.id.toString()} userId:${userId.toString()}`,
      );
      const messageWhere: any = { contactId: contact.id };
      const unreadWhere: any = {
        contactId: contact.id,
        read: false,
        senderId: contact.seller_id === userId ? contact.invited_user_id : contact.seller_id,
      };
      const lastMessageWhere: any = { contactId: contact.id };

      if (lastDelete?.createdAt) {
        messageWhere.createdAt = MoreThan(lastDelete.createdAt);
        unreadWhere.createdAt = MoreThan(lastDelete.createdAt);
        lastMessageWhere.createdAt = MoreThan(lastDelete.createdAt);
      }

      const messageCount = await this.messageRepository.count({ where: messageWhere });
      if (messageCount === 0) continue;

      const unreadMessagesCount = await this.messageRepository.count({ where: unreadWhere });

      const lastMessage = await this.messageRepository.findOne({
        where: lastMessageWhere,
        order: { createdAt: 'DESC' },
      });

      const { full_name } = contact;
      const { profile_picture, phone_number } = contact.invited_user;

      chats.push({
        username: full_name,
        phone_number,
        profile_picture: profile_picture
          ? await this.fileService.getPresignedUrl(Number(profile_picture), 3600)
          : '',
        contactId: contact.id,
        unreadMessagesCount,
        messageType: lastMessage?.messageType,
        lastMessage: lastMessage?.content ?? null,
        message: lastMessage,
        read: lastMessage?.read ?? false,
        lastMessageAt: lastMessage?.createdAt?.toISOString() ?? null,
        type: ChatType.CHAT,
        is_deleted: contact.invited_user.is_deleted,
        isBlocked,
        invitationId: contact?.invited_user_id,
      });
    }

    const broadcasts: TransformedBroadcast[] = await Promise.all(
      broadcastsRaw.map(async (broadcast: BroadcastResult) => {
        const customersWithPresignedUrls: TransformedCustomer[] = await Promise.all(
          broadcast.customers.map(async customer => {
            const contact = contacts.find(
              c =>
                String(c.seller_id) === String(broadcast.broadcast_seller_id) &&
                String(c.invited_user?.id) === String(customer.customer_id),
            );

            return {
              id: customer.customer_id,
              name: contact?.full_name || '',
              profile_picture: customer.customer_profile_picture
                ? await this.fileService.getPresignedUrl(customer.customer_profile_picture)
                : null,
            };
          }),
        );

        const lastMessage = await this.messageRepository.findOne({
          where: { broadcastId: broadcast.broadcast_id },
          order: { createdAt: 'DESC' },
        });

        return {
          id: broadcast.broadcast_id,
          seller_id: broadcast.broadcast_seller_id,
          name: broadcast.broadcast_name,
          created_at: broadcast.broadcast_created_at,
          updated_at: broadcast.broadcast_updated_at,
          deleted_at: broadcast.broadcast_deleted_at,
          totalRecipientsCount: +broadcast.total_recipients_count,
          customers: customersWithPresignedUrls,
          lastMessageAt: lastMessage?.createdAt?.toISOString() ?? null,
          type: ChatType.BROADCAST,
        };
      }),
    );

    const combined = [...chats, ...broadcasts];

    combined.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });

    return combined;
  }

  async deleteChat(contactId: bigint): Promise<void> {
    await this.messageRepository.softDelete({ contactId });
  }
  async findBroadcast(id: number) {
    return this.broadcastRepository.findOne({
      where: {
        id,
      },
    });
  }
  async getBroadcastsBySeller(sellerId: bigint): Promise<TransformedBroadcast[]> {
    const result: BroadcastResult[] = await this.dataSource
      .createQueryBuilder()
      .select('broadcast.id', 'broadcast_id')
      .addSelect('broadcast.seller_id', 'broadcast_seller_id')
      .addSelect('broadcast.name', 'broadcast_name')
      .addSelect('broadcast.created_at', 'broadcast_created_at')
      .addSelect('broadcast.updated_at', 'broadcast_updated_at')
      .addSelect('broadcast.deleted_at', 'broadcast_deleted_at')
      .addSelect('COUNT(DISTINCT recipient.customer_id)', 'total_recipients_count')
      .addSelect(
        `COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'customer_id', customer.id,
            'customer_username', customer.username,
            'customer_profile_picture', customer.profile_picture,
            'recipient_deleted_at', recipient.deleted_at
          )
        ) FILTER (WHERE customer.id IS NOT NULL),
        '[]'
      )`,
        'customers',
      )
      .from(Broadcast, 'broadcast')
      .leftJoin('broadcast.recipients', 'recipient')
      .leftJoin('recipient.customer', 'customer')
      .groupBy('broadcast.id')
      .where('broadcast.seller_id = :sellerId', { sellerId: sellerId.toString() })
      .orderBy('broadcast.id', 'DESC')
      .getRawMany();

    return Promise.all(
      result.map(async broadcast => {
        const customersWithPresignedUrls: TransformedCustomer[] = await Promise.all(
          broadcast.customers.map(async customer => ({
            id: customer.customer_id,
            name: customer.customer_username,
            profile_picture: customer.customer_profile_picture
              ? await this.fileService.getPresignedUrl(customer.customer_profile_picture)
              : null,
          })),
        );

        return {
          id: broadcast.broadcast_id,
          seller_id: broadcast.broadcast_seller_id,
          name: broadcast.broadcast_name,
          created_at: broadcast.broadcast_created_at,
          updated_at: broadcast.broadcast_updated_at,
          deleted_at: broadcast.broadcast_deleted_at,
          totalRecipientsCount: +broadcast.total_recipients_count,
          lastMessageAt: '',
          customers: customersWithPresignedUrls,
        };
      }),
    );
  }
  async getBroadcastsRecipientById(broadcastId: number) {
    const broadcast = await this.broadcastRepository.findOne({
      where: { id: broadcastId },
    });

    if (!broadcast) {
      throw new NotFoundException('Broadcast not available');
    }

    const result = await this.broadcastRecipientRepository
      .createQueryBuilder('recipient')
      .leftJoinAndSelect('recipient.customer', 'customer')
      .leftJoin(
        Contact,
        'contact',
        'contact.seller = :sellerId AND contact.phone_number = customer.phone_number',
        { sellerId: broadcast.sellerId },
      )
      .where('recipient.broadcastId = :broadcastId', { broadcastId })
      .andWhere('customer.is_deleted = false')
      .select([
        'customer.id as id',
        'customer.phone_number as phone_number',
        'customer.profile_picture as profile_picture',
        'contact.id',
        'contact.full_name as name',
      ])
      .getRawMany(); // <-- use getRawMany since it's not an entity relation
    return Promise.all(
      result.map(async obj => ({
        ...obj,
        profile_picture: await this.fileService.getPresignedUrl(obj.profile_picture),
      })),
    );
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
    const messages = await this.messageRepository.find({
      where: { contactId: contact.id, broadcastId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
    const messagesNew = await this.convertUrls(messages);

    return { broadcast, messages: messagesNew };
  }
  async deleteBroadcastsBySeller(id: number): Promise<UpdateResult> {
    return this.broadcastRepository.softDelete({ id });
  }
  async deleteBroadcastsAndChat(deleteBulkDto: BulkDeleteDto, userId: bigint) {
    return await Promise.all(
      deleteBulkDto.data.map(async deleteBulk => {
        // const id = BigInt(deleteBulk.id); // Ensure correct bigint type

        switch (deleteBulk.type) {
          case DeleteType.BROADCAST:
            return this.broadcastRepository.softDelete({ id: Number(deleteBulk.id) });

          case DeleteType.CHAT:
            // `contactId` is a bigint column — pass a `FindOptionsWhere` object with `bigint`
            // return this.messageRepository.softDelete({ contactId: BigInt(deleteBulk.id) });

            return await this.deleteChatRepository.save({
              contactId: deleteBulk.id.toString(),
              userId: userId.toString(),
            });

          default:
            return null;
        }
      }),
    );
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
  async markAllMessagesRead(contactId: number) {
    const contact = await this.contactRepository.findOne({
      where: { id: BigInt(contactId) },
    });
    if (!contact) {
      throw new NotAcceptableException(`Contact not found`);
    }
    return await this.messageRepository.update(
      { contactId: BigInt(contactId), read: false },
      { read: true },
    );
  }
  async findContactByBroadcastId(broadcastId: number, currentUserId: bigint) {
    this.logger.debug(
      `Fetching contacts with unread message count broadcastId: ${broadcastId} currentUserId: ${currentUserId}`,
    );

    return (
      this.broadcastRepository
        .createQueryBuilder('broadcast')
        .leftJoin('broadcast.recipients', 'recipient')
        .leftJoin(
          'contacts',
          'contacts',
          `
        contacts.seller_id = broadcast.seller_id
        AND contacts.invited_user_id = recipient.customer_id
      `,
        )
        .leftJoin(
          'messages',
          'message',
          `
        message.contact_id = contacts.id
        AND message.broadcast_id = broadcast.id
        AND message.read = false
      `,
        )
        // Subquery: last message not deleted
        .leftJoin(
          qb =>
            qb
              .select('m.id', 'id')
              .addSelect('m.contact_id', 'contact_id')
              .addSelect('m.content', 'content')
              .addSelect('m.created_at', 'created_at')
              .addSelect('m.read', 'read') // ← Added this
              .from('messages', 'm')
              .where('m.broadcast_id = :broadcastId', { broadcastId }).andWhere(`
            NOT EXISTS (
              SELECT 1 FROM deleted_chats dc
              WHERE dc.contact_id = m.contact_id
                AND dc.user_id = :currentUserId
            )
          `).andWhere(`
            m.id = (
              SELECT id FROM messages
              WHERE contact_id = m.contact_id
                AND broadcast_id = :broadcastId
              ORDER BY created_at DESC
              LIMIT 1
            )
          `),
          'last_message',
          'last_message.contact_id = contacts.id',
        )
        .where('broadcast.id = :broadcastId', { broadcastId })
        .andWhere(
          `
      NOT EXISTS (
        SELECT 1 FROM deleted_chats dc
        WHERE dc.contact_id = contacts.id
          AND dc.user_id = :currentUserId
      )
    `,
        )
        .setParameters({ broadcastId, currentUserId })
        .select([
          'COUNT(message.id) AS unreadMessagesCount',
          'contacts.full_name AS username',
          'contacts.id AS contactId',
          'contacts.phone_number AS phoneNumber',
          'last_message.content AS lastMessage',
          'last_message.created_at AS lastMessageAt',
          'last_message.read AS read',
          'contacts.invited_user_id AS userId',
          'contacts.seller_id AS sellerId',
        ])
        .groupBy('contacts.id')
        .addGroupBy('contacts.full_name')
        .addGroupBy('contacts.phone_number')
        .addGroupBy('contacts.invited_user_id')
        .addGroupBy('contacts.seller_id')
        .addGroupBy('last_message.content')
        .addGroupBy('last_message.created_at')
        .addGroupBy('last_message.read')
        .getRawMany()
    );
  }
}
