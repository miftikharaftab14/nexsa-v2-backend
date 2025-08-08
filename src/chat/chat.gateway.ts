import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendBroadcastDto } from './dto/send-broadcast.dto';
import { ContactService } from 'src/contacts/services/contact.service';
import { UserService } from 'src/users/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { FileService } from 'src/files/services/file.service';
import { Message, MessageType } from './entities/message.entity';
import { InjectionToken } from 'src/common/constants/injection-tokens';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AuthenticatedSocket } from './type/socket-client';
import { MarkReadChatDto } from './dto/mark-read-chat.dto';
import { File } from 'src/files/entities/file.entity';
import { ProductChatInitiateDto } from './dto/product-chat-initiate.dto';
import { GalleryImagesService } from 'src/gallery-image/gallery-images.service';
import { ChatResult, ChatType, TransformedBroadcast } from 'src/common/types/chat';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { DeletedChat } from './entities/deleted-chat.entity';
import { User } from 'src/users/entities/user.entity';
import { Contact } from 'src/contacts/entities/contact.entity';

@WebSocketGateway({
  namespace: '/ws/chat',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');
  private redis: Redis;
  private redisPrefix = 'socket';

  constructor(
    private readonly chatService: ChatService,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly contactService: ContactService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: FileService,
    private readonly galleryImagesService: GalleryImagesService,
    @InjectRepository(DeletedChat)
    private readonly deleteChatRepository: Repository<DeletedChat>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('ChatGateway Initialized!');
    try {
      const pubClient = new Redis({
        host: process.env.REDIS_ADAPTER_HOST,
        port: Number(process.env.REDIS_ADAPTER_PORT),
        username: process.env.REDIS_ADAPTER_USERNAME,
        password: process.env.REDIS_ADAPTER_PASSWORD,
      });

      const subClient = pubClient.duplicate();
      this.redis = pubClient;

      server.adapter(createAdapter(pubClient, subClient));

      this.logger.log('✅ Redis adapter initialized on WebSocket server');
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(`❌ Failed to initialize Redis adapter: ${err.message}`, err.stack);
      } else {
        this.logger.error('❌ Failed to initialize Redis adapter:', JSON.stringify(err));
      }
    }
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const authHeader: string = (client.handshake.headers['authorization'] ||
        client.handshake.auth?.token) as string;

      if (!authHeader) {
        client.disconnect();
        throw new UnauthorizedException('No token provided');
      }

      const token: string = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      const jwtSecret = process.env.JWT_SECRET || 'supersecret';
      const payload: { sub?: bigint; role: UserRole; iat: number; userId?: bigint } =
        this.jwtService.verify(token, {
          secret: jwtSecret,
        });
      const userId = payload.sub || payload.userId;
      if (!userId) throw new UnauthorizedException('No found user');

      const user = await this.userService.findOne(userId);
      if (!user) {
        client.disconnect();
        throw new UnauthorizedException('Invalid user');
      }

      client.user = user;

      // Save mappings in Redis
      await this.redis.set(`${this.redisPrefix}:user_socket:${user.id}`, client.id);
      await this.redis.set(`${this.redisPrefix}:socket_user:${client.id}`, user.id.toString());

      this.logger.log(`✅ Client connected: ${client.id}, userId: ${user.id}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      client.disconnect();
      this.logger.warn(`Socket connection rejected: ${errorMessage}`);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    try {
      const socketKey = `${this.redisPrefix}:socket_user:${client.id}`;
      const userId = await this.redis.get(socketKey);
      if (userId) {
        await this.redis.del(`${this.redisPrefix}:user_socket:${userId}`);
      }
      await this.redis.del(socketKey);
      this.logger.log(`❌ Client disconnected: ${client.id}`);
    } catch (error: any) {
      this.logger.warn(
        `Disconnect cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (typeof data !== 'object' || data === null) {
        throw new BadRequestException('Invalid payload type. Expected an object.');
      }

      const user = client.user;
      if (!user) throw new UnauthorizedException('Unauthorized');

      const sender = await this.userService.findOne(user.id);
      if (!sender) throw new NotFoundException('Sender not found');

      const contactResp = await this.contactService.findOne(data.contactId);
      const contact = contactResp?.data;
      if (!contact) throw new NotFoundException('Chat/contact not found');

      const mediaCont: Record<number, string> = {};
      const messages: Message[] = [];

      // Upload and send messages with media if exists
      if (Array.isArray(data.media) && data.media.length > 0) {
        const uploadedFiles = await Promise.all(
          data.media.map(file => this.fileService.storeUploadedFile(file)),
        );

        const createdMessages = await Promise.all(
          uploadedFiles.map(async file => {
            const mediaUrl = await this.fileService.getPresignedUrl(file.id);
            mediaCont[file.id] = mediaUrl;

            return await this.chatService.createMessage(
              contact,
              sender,
              file.mimeType.startsWith('video/')
                ? MessageType.VIDEO
                : file.mimeType.startsWith('image/')
                  ? MessageType.IMAGE
                  : MessageType.FILE,
              data.content,
              file.id,
            );
          }),
        );

        messages.push(...createdMessages);
      } else {
        // Create message without media
        const message = await this.chatService.createMessage(
          contact,
          sender,
          data.messageType,
          data.content,
        );
        messages.push(message);
      }

      // Determine receiver
      const receiverId =
        user.id === contact.seller_id ? contact.invited_user_id : contact.seller_id;
      const receiverSocketId = await this.redis.get(
        `${this.redisPrefix}:user_socket:${receiverId}`,
      );
      const senderSocketId = await this.redis.get(`${this.redisPrefix}:user_socket:${user.id}`);

      // Emit each message to receiver and sender
      for (const message of messages) {
        const mediaUrl = message.mediaKey ? mediaCont[message.mediaKey] : null;
        const chatMessageResult = await this.reciverMessage(
          contact.id,
          receiverId,
          sender,
          contact,
          message,
          mediaUrl,
        );

        if (receiverSocketId) {
          this.server.to(receiverSocketId).emit('receive_message', chatMessageResult);
        }

        if (senderSocketId && senderSocketId !== receiverSocketId) {
          this.server.to(senderSocketId).emit('send_message', {
            unreadMessagesCount: 0,
            username: contact.full_name,
            contactId: contact.id,
            phone_number: contact.phone_number,
            profile_picture: '',
            lastMessage: message.content,
            lastMessageAt: message.createdAt?.toISOString(),
            sender,
            read: false,
            message,
            mediaCont: {
              mediaUrl,
              thumbnailUrl: '',
            },
          });
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      client.emit('error_message', { message });
    }
  }
  async reciverMessage(
    contactId: bigint,
    receiverId: bigint,
    sender: User,
    contact: Contact,
    message: Message,
    mediaUrl: string | null,
  ): Promise<ChatResult> {
    const lastDelete = await this.deleteChatRepository.findOne({
      where: {
        contactId: contactId.toString(),
        userId: receiverId.toString(),
      },
      order: { createdAt: 'DESC' },
    });

    const messageWhere: any = { contactId };
    const unreadWhere: any = {
      contactId: contactId,
      read: false,
      senderId: sender.id,
    };
    const lastMessageWhere: any = { contactId };

    if (lastDelete?.createdAt) {
      messageWhere.createdAt = MoreThan(lastDelete.createdAt);
      unreadWhere.createdAt = MoreThan(lastDelete.createdAt);
      lastMessageWhere.createdAt = MoreThan(lastDelete.createdAt);
    }

    const unreadMessagesCount = await this.messageRepository.count({ where: unreadWhere });
    this.logger.log(`unread message count ${unreadMessagesCount}`);
    const chatMessageResult: ChatResult = {
      unreadMessagesCount: unreadMessagesCount,
      username: sender.role === UserRole.CUSTOMER ? contact.full_name : sender.username,
      contactId: contactId,
      phone_number: sender.phone_number,
      sender,
      profile_picture: sender.profile_picture
        ? await this.fileService.getPresignedUrl(Number(sender.profile_picture), 3600)
        : '',
      lastMessage: message.content,
      lastMessageAt: message.createdAt?.toISOString(),
      read: false,
      message,
      mediaCont: {
        mediaUrl: mediaUrl,
        thumbnailUrl: '',
      },
    };
    return chatMessageResult;
  }
  @SubscribeMessage('send_broadcast')
  async handleSendBroadcast(
    @MessageBody() data: SendBroadcastDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (typeof data !== 'object' || data === null) {
        throw new BadRequestException('Invalid payload type. Expected an object.');
      }
      const broadcast = await this.chatService.findBroadcast(data.broadcastId);
      if (!broadcast) throw new NotFoundException('broadcast not found');
      const user = client.user;
      const sender = await this.userService.findOne(user.id);
      if (!sender) throw new NotFoundException('Sender not found');

      const mediaCont: Record<number, string> = {};
      const uploadedMediaFiles: File[] = [];

      // 1. Upload all media files
      if (Array.isArray(data.media) && data.media.length > 0) {
        const uploaded = await Promise.all(
          data.media.map(file => this.fileService.storeUploadedFile(file)),
        );

        for (const file of uploaded) {
          const url = await this.fileService.getPresignedUrl(file.id);
          mediaCont[file.id] = url;
          uploadedMediaFiles.push(file);
        }
      }

      const broadcastReceivers = await this.chatService.getBroadcastContactIds(data.broadcastId);

      // 2. Create/send message for each media/contact
      await Promise.all(
        broadcastReceivers.map(async contactId => {
          const { data: contact } = await this.contactService.findOne(contactId);
          const receiverId =
            user.id === contact.seller_id ? contact.invited_user_id : contact.seller_id;
          const receiverSocketId = await this.redis.get(
            `${this.redisPrefix}:user_socket:${receiverId}`,
          );

          if (uploadedMediaFiles.length > 0) {
            for (const file of uploadedMediaFiles) {
              const messageType = file.mimeType.startsWith('video/')
                ? MessageType.VIDEO
                : file.mimeType.startsWith('image/')
                  ? MessageType.IMAGE
                  : MessageType.FILE;

              const message = await this.chatService.createMessage(
                contact,
                sender,
                messageType,
                data.content,
                file.id,
                data.broadcastId,
              );
              const chatMessageResult = await this.reciverMessage(
                contact.id,
                receiverId,
                sender,
                contact,
                message,
                mediaCont[file.id],
              );
              if (receiverSocketId) {
                this.server.to(receiverSocketId).emit('receive_message', chatMessageResult);
              }
            }
          } else {
            const message = await this.chatService.createMessage(
              contact,
              sender,
              data.messageType,
              data.content,
              undefined,
              data.broadcastId,
            );
            const chatMessageResult = await this.reciverMessage(
              contact.id,
              receiverId,
              sender,
              contact,
              message,
              null,
            );
            if (receiverSocketId) {
              this.server.to(receiverSocketId).emit('receive_message', chatMessageResult);
            }
          }
        }),
      );

      // 3. Optionally, notify sender that broadcast was sent
      const senderSocketId = await this.redis.get(`${this.redisPrefix}:user_socket:${sender.id}`);
      this.logger.log(
        `broadcast sender socket details sender id: ${sender.id} senderSocketId: ${senderSocketId}`,
      );
      if (senderSocketId) {
        const senderMessageData: TransformedBroadcast = {
          id: broadcast.id,
          seller_id: broadcast.sellerId.toString(),
          name: broadcast.name,
          created_at: broadcast.createdAt,
          updated_at: broadcast.updatedAt,
          deleted_at: broadcast.deletedAt || null,
          totalRecipientsCount: +broadcastReceivers.length,
          customers: [],
          lastMessageAt: new Date()?.toISOString() ?? null,
          type: ChatType.BROADCAST,
        };
        console.log({ senderMessageData });

        this.server.to(senderSocketId).emit('broadcast_sent', senderMessageData);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      client.emit('error_message', { message });
    }
  }

  // this is for mark messages ready for a chat
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: MarkReadChatDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`Marking messages as read for contactId: ${data.contactId}`);
    const user = client.user;

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Mark messages read
    await this.chatService.markAllMessagesRead(data.contactId);

    // Get the contact
    const contactResp = await this.contactService.findOne(data.contactId);
    const contact = contactResp?.data;

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Determine the opposite user
    const isInvitedUser = contact.invited_user_id === user.id;
    const oppositeUserId = isInvitedUser ? contact.seller_id : contact.invited_user_id;
    const senderId = isInvitedUser ? contact.invited_user_id : contact.seller_id;

    // Fetch socketId of the opposite user
    const oppositeSocketId = await this.redis.get(
      `${this.redisPrefix}:user_socket:${oppositeUserId}`,
    );

    if (oppositeSocketId) {
      this.server.to(oppositeSocketId).emit('read_ack', {
        contactId: data.contactId,
        readerId: user.id,
      });
    }
    // Fetch socketId of the sender
    const senderSocketId = await this.redis.get(`${this.redisPrefix}:user_socket:${senderId}`);

    if (senderSocketId) {
      this.server.to(senderSocketId).emit('read_ack', {
        contactId: data.contactId,
        readerId: user.id,
      });
    }
  }
  @SubscribeMessage('product-chat-initiate')
  async handleProductChat(
    @MessageBody() data: ProductChatInitiateDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { productId, sellerId, content, messageType } = data;
      const user = client.user;
      if (!user) throw new UnauthorizedException('Unauthorized');

      const sender = await this.userService.findOne(user.id);
      if (!sender) throw new NotFoundException('Sender not found');

      const contact = await this.contactService.findBySellerAndCustomer(sellerId, sender.id);
      if (!contact) throw new NotFoundException('Chat/contact not found');

      const galleryImage = await this.galleryImagesService.findOne(productId);
      if (!galleryImage || !galleryImage.mediaFileId) {
        throw new NotFoundException('Product or product image not found');
      }
      await this.chatService.createMessage(
        contact,
        sender,
        messageType as MessageType,
        '',
        galleryImage.mediaFileId,
      );
      const message = await this.chatService.createMessage(
        contact,
        sender,
        MessageType.TEXT,
        content,
        galleryImage.mediaFileId,
      );

      const mediaUrl = await this.fileService.getPresignedUrl(galleryImage.mediaFileId);
      const receiverId =
        user.id === contact.seller_id ? contact.invited_user_id : contact.seller_id;
      const reciver = await this.userService.findOne(receiverId);
      const receiverSocketId = await this.redis.get(
        `${this.redisPrefix}:user_socket:${receiverId}`,
      );
      if (receiverSocketId) {
        const resultMessage = await this.reciverMessage(
          contact.id,
          receiverId,
          sender,
          contact,
          message,
          mediaUrl,
        );
        this.server.to(receiverSocketId).emit('receive_message', resultMessage);
      }
      const senderSocketId = await this.redis.get(`${this.redisPrefix}:user_socket:${user.id}`);
      if (senderSocketId)
        this.server.to(senderSocketId).emit('send_message', {
          unreadMessagesCount: 0,
          username: reciver?.username,
          contactId: contact.id,
          phone_number: reciver?.phone_number,
          profile_picture: reciver?.profile_picture
            ? await this.fileService.getPresignedUrl(Number(reciver?.profile_picture), 3600)
            : '',
          lastMessage: message.content,
          lastMessageAt: message.createdAt?.toISOString(),
          sender,
          read: false,
          message,
          mediaCont: {
            mediaUrl,
            thumbnailUrl: '',
          },
        });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      client.emit('product-chat-initiate_error', { message });
    }
  }

  public async emitMessageToUser(
    contactId: bigint,
    receiverId: bigint,
    sender: User,
    contact: Contact,
    message: Message,
    mediaUrl: string | null,
  ) {
    const resultMessage = await this.reciverMessage(
      contactId,
      receiverId,
      sender,
      contact,
      message,
      mediaUrl,
    );
    const socketId = await this.redis.get(
      `${this.redisPrefix}:user_socket:${receiverId.toString()}`,
    );

    if (socketId) {
      this.server.to(socketId).emit('receive_message', {
        ...resultMessage,
        message: {
          ...resultMessage.message,
          contactId: resultMessage.message?.contactId.toString(),
        },
      });
    }
  }
}
