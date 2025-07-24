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
import { Contact } from 'src/contacts/entities/contact.entity';
import { JwtService } from '@nestjs/jwt';
import { FileService } from 'src/files/services/file.service';
import { MessageType } from './entities/message.entity';
import { InjectionToken } from 'src/common/constants/injection-tokens';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AuthenticatedSocket } from './type/socket-client';
import { MarkReadChatDto } from './dto/mark-read-chat.dto';

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
    private readonly contactService: ContactService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(InjectionToken.FILE_SERVICE)
    private readonly fileService: FileService,
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

      let contact: Contact | null = null;
      try {
        const contactResp = await this.contactService.findOne(data.contactId);
        contact = contactResp?.data;
      } catch {
        contact = null;
      }

      if (!contact) throw new NotFoundException('Chat/contact not found');

      let mediaKey: number | undefined;
      const mediaCont: Record<string, string> = {};

      if (
        (data.messageType === MessageType.IMAGE || data.messageType === MessageType.FILE) &&
        data.image
      ) {
        const uploadedFile = await this.fileService.storeUploadedFile(data.image);
        mediaKey = uploadedFile.id;
        mediaCont.mediaUrl = await this.fileService.getPresignedUrl(mediaKey);
        delete data.image;
      }

      const message = await this.chatService.createMessage(
        contact,
        sender,
        data.messageType,
        data.content,
        mediaKey,
      );

      const receiverId =
        user.id === contact.seller_id ? contact.invited_user_id : contact.seller_id;
      this.logger.log({ receiverId });

      const receiverSocketId = await this.redis.get(
        `${this.redisPrefix}:user_socket:${receiverId}`,
      );
      this.logger.log({ receiverSocketId });
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('receive_message', { ...message, mediaCont });
      }
      this.logger.log(`${this.redisPrefix}:user_socket:${user.id}`);
      const senderSocketId = await this.redis.get(`${this.redisPrefix}:user_socket:${user.id}`);
      if (senderSocketId && senderSocketId !== receiverSocketId) {
        this.logger.log(`send: ${this.redisPrefix}:user_socket:${user.id}`);
        this.server.to(senderSocketId).emit('send_message', { ...message, mediaCont });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      client.emit('error_message', { message });
    }
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
      const user = client.user;
      const sender = await this.userService.findOne(user.id);
      if (!sender) throw new NotFoundException('Sender not found');
      let mediaKey: number | undefined;
      const mediaCont: Record<string, string> = {};

      if (
        (data.messageType === MessageType.IMAGE || data.messageType === MessageType.FILE) &&
        data.image
      ) {
        let base64 = data.image;
        const matches = base64.match(/^data:(.+);base64,(.+)$/);
        if (matches) base64 = matches[2];

        const buffer = Buffer.from(base64, 'base64');
        const originalname = data.messageType === MessageType.IMAGE ? 'upload.png' : 'upload.bin';
        const mimetype =
          data.messageType === MessageType.IMAGE ? 'image/png' : 'application/octet-stream';

        const uploaded = await this.fileService.uploadBufferAsFile(
          buffer,
          originalname,
          mimetype,
          buffer.length,
          'chat-media',
        );
        mediaKey = uploaded.id;
        mediaCont.mediaUrl = await this.fileService.getPresignedUrl(mediaKey);
        mediaCont.thumbnailUrl = await this.fileService.getThumbnailPresignedUrl(mediaKey);
        delete data.image;
      }
      const broadcastRecivers = await this.chatService.getBroadcastContactIds(data.broadcastId);
      await Promise.all(
        broadcastRecivers.map(async contentId => {
          const { data: contact } = await this.contactService.findOne(contentId);
          const message = await this.chatService.createMessage(
            contact,
            sender,
            data.messageType,
            data.content,
            undefined,
            data.broadcastId,
          );

          const receiverId =
            user.id === contact.seller_id ? contact.invited_user_id : contact.seller_id;

          const receiverSocketId = await this.redis.get(
            `${this.redisPrefix}:user_socket:${receiverId}`,
          );
          if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('receive_message', { ...message, mediaCont });
          }
        }),
      );

      const senderSocketId = await this.redis.get(`${this.redisPrefix}:user_socket:${user.id}`);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('receive_message', {
          broadcastId: data.broadcastId,
          messageType: data.messageType,
          content: data.content,
          mediaCont,
          senderId: sender.id,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      client.emit('error_message', { message });
    }
  }
  // this is for mark messages ready for a chat
  @SubscribeMessage('mark_read')
  handleMarkRead(
    @MessageBody() data: MarkReadChatDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(data, client);
  }

  public async emitMessageToUser(userId: number | bigint, message: any) {
    const socketId = await this.redis.get(`${this.redisPrefix}:user_socket:${userId}`);
    if (socketId) {
      this.server.to(socketId).emit('receive_message', message);
    }
  }
}
