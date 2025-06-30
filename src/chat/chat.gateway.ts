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
  UsePipes,
  ValidationPipe,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendBroadcastDto } from './dto/send-broadcast.dto';
import { ContactService } from 'src/contacts/services/contact.service';
import { UserService } from 'src/users/services/user.service';
import { Contact } from 'src/contacts/entities/contact.entity';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust for production
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  constructor(
    private readonly chatService: ChatService,
    private readonly contactService: ContactService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('ChatGateway Initialized!');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      // Extract JWT from handshake headers
      const authHeader = client.handshake.headers['authorization'] || client.handshake.auth?.token;
      if (!authHeader) {
        client.disconnect();
        throw new UnauthorizedException('No token provided');
      }
      // Support both 'Bearer <token>' and raw token
      const token: string = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

      // Ensure JWT_SECRET is available
      const jwtSecret = process.env.JWT_SECRET || 'supersecret';
      if (!jwtSecret) {
        client.disconnect();
        this.logger.error('JWT_SECRET is not set in environment variables.');
        throw new UnauthorizedException('JWT secret not configured');
      }
      // Verify and decode token with explicit secret
      const payload = this.jwtService.verify(token, { secret: jwtSecret });
      // Fetch user
      const user = await this.userService.findOne(payload.sub || payload.userId);
      if (!user) {
        client.disconnect();
        throw new UnauthorizedException('Invalid user');
      }
      // Attach user info to socket
      (client as any).user = user;
      this.logger.log(`Client connected: ${client.id}, userId: ${user.id}`);
    } catch (err) {
      client.disconnect();
      this.logger.warn(`Socket connection rejected: ${err.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(@MessageBody() data: SendMessageDto, @ConnectedSocket() client: Socket) {
    try {
      if (typeof data !== 'object' || data === null) {
        throw new BadRequestException('Invalid payload type. Expected an object.');
      }

      const user = (client as any).user;
      if (!user) {
        throw new UnauthorizedException('Unauthorized');
      }

      const sender = await this.userService.findOne(user.id);
      if (!sender) {
        throw new NotFoundException('Sender not found');
      }

      let contact: Contact | null = null;
      try {
        const contactResp = await this.contactService.findOne(data.contactId);
        contact = contactResp?.data;
      } catch (e) {
        contact = null;
      }
      if (!contact) {
        throw new NotFoundException('Chat/contact not found');
      }

      const message = await this.chatService.createMessage(
        contact,
        sender,
        data.messageType,
        data.content,
        data.mediaKey,
      );

      this.server.emit('receive_message', message);
    } catch (error) {
      // For NestJS's built-in exceptions, the actual message is often in `error.response.message`
      const message = error.response?.message || error.message || 'An unexpected error occurred.';
      client.emit('error_message', { message });
    }
  }

  @SubscribeMessage('send_broadcast')
  async handleSendBroadcast(
    @MessageBody() data: SendBroadcastDto,
    @ConnectedSocket() client: Socket,
  ) {
    // TODO: Implement broadcast logic
    this.server.emit('receive_broadcast', data);
  }
}
