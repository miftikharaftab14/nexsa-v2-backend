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
import { Server, Socket } from 'socket.io';
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

  async handleConnection(client: Socket) {
    try {
      const authHeader: string = (client.handshake.headers['authorization'] ||
        client.handshake.auth?.token) as string;
      if (!authHeader) {
        client.disconnect();
        throw new UnauthorizedException('No token provided');
      }

      const token: string = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      const jwtSecret = process.env.JWT_SECRET || 'supersecret';
      const payload = this.jwtService.verify(token, { secret: jwtSecret });

      const user = await this.userService.findOne(payload.sub || payload.userId);
      if (!user) {
        client.disconnect();
        throw new UnauthorizedException('Invalid user');
      }

      (client as any).user = user;

      // Save mappings in Redis
      await this.redis.set(`${this.redisPrefix}:user_socket:${user.id}`, client.id);
      await this.redis.set(`${this.redisPrefix}:socket_user:${client.id}`, user.id.toString());

      this.logger.log(`✅ Client connected: ${client.id}, userId: ${user.id}`);
    } catch (err: any) {
      client.disconnect();
      this.logger.warn(`Socket connection rejected: ${err.message}`);
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const socketKey = `${this.redisPrefix}:socket_user:${client.id}`;
      const userId = await this.redis.get(socketKey);
      if (userId) {
        await this.redis.del(`${this.redisPrefix}:user_socket:${userId}`);
      }
      await this.redis.del(socketKey);
      this.logger.log(`❌ Client disconnected: ${client.id}`);
    } catch (err: any) {
      this.logger.warn(`Disconnect cleanup failed: ${err.message}`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(@MessageBody() data: SendMessageDto, @ConnectedSocket() client: Socket) {
    try {
      if (typeof data !== 'object' || data === null) {
        throw new BadRequestException('Invalid payload type. Expected an object.');
      }

      const user = (client as any).user;
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

      const message = await this.chatService.createMessage(
        contact,
        sender,
        data.messageType,
        data.content,
        mediaKey,
      );

      const receiverId =
        user.id === contact.seller_id ? contact.invited_user_id : contact.seller_id;

      const receiverSocketId = await this.redis.get(
        `${this.redisPrefix}:user_socket:${receiverId}`,
      );
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('receive_message', { ...message, mediaCont });
      }

      const senderSocketId = await this.redis.get(`${this.redisPrefix}:user_socket:${user.id}`);
      if (senderSocketId && senderSocketId !== receiverSocketId) {
        this.server.to(senderSocketId).emit('receive_message', { ...message, mediaCont });
      }
    } catch (error: any) {
      const message = error.response?.message || error.message || 'An unexpected error occurred.';
      client.emit('error_message', { message });
    }
  }

  @SubscribeMessage('send_broadcast')
  async handleSendBroadcast(
    @MessageBody() data: SendBroadcastDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log({ client, data });

    await this.server.emit('receive_broadcast', data);
  }

  public async emitMessageToUser(userId: number | bigint, message: any) {
    const socketId = await this.redis.get(`${this.redisPrefix}:user_socket:${userId}`);
    if (socketId) {
      this.server.to(socketId).emit('receive_message', message);
    }
  }
}
