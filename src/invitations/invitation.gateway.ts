import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/common/enums/user-role.enum';

type InvitationSocket = Socket & { user?: User };

@WebSocketGateway({
  namespace: '/ws/invitations',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['authorization', 'content-type'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class InvitationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(InvitationGateway.name);
  private readonly redisPrefix = 'socket';
  private redis: Redis;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  afterInit() {
    this.logger.log('InvitationGateway initialized');
    this.redis = new Redis({
      host: process.env.REDIS_ADAPTER_HOST,
      port: Number(process.env.REDIS_ADAPTER_PORT),
      username: process.env.REDIS_ADAPTER_USERNAME,
      password: process.env.REDIS_ADAPTER_PASSWORD,
    });
  }

  async handleConnection(@ConnectedSocket() client: InvitationSocket) {
    try {
      const authHeader = (client.handshake.headers['authorization'] ||
        client.handshake.auth?.token) as string | undefined;
      const userId = await this.resolveUserId(client, authHeader);

      const user = await this.userRepository.findOne({
        where: { id: BigInt(userId) },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid user');
      }

      client.user = user;

      await this.redis.set(`${this.redisPrefix}:invitation_user_socket:${user.id}`, client.id);
      await this.redis.set(`${this.redisPrefix}:invitation_socket_user:${client.id}`, user.id.toString());
      this.logger.log(`Invitation socket connected: ${client.id}, userId: ${user.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Invitation socket rejected: ${message}`);
      client.disconnect();
    }
  }

  private async resolveUserId(
    client: InvitationSocket,
    authHeader?: string,
  ): Promise<bigint> {
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      const payload: { sub?: bigint; userId?: bigint; role?: UserRole } = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'supersecret',
      });
      const tokenUserId = payload.sub || payload.userId;
      if (!tokenUserId) {
        throw new UnauthorizedException('No user id found in token');
      }
      return BigInt(tokenUserId);
    }

    // Local dev fallback to avoid hard JWT requirement while testing socket UI.
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('No token provided');
    }

    const authUserId = client.handshake.auth?.userId;
    const queryUserId = client.handshake.query?.userId;
    const rawUserId =
      typeof authUserId === 'string'
        ? authUserId
        : typeof queryUserId === 'string'
          ? queryUserId
          : undefined;

    if (!rawUserId) {
      throw new UnauthorizedException('No token provided and no dev userId found');
    }

    this.logger.warn(`Invitation socket connected via dev userId fallback: ${rawUserId}`);
    return BigInt(rawUserId);
  }

  async handleDisconnect(@ConnectedSocket() client: InvitationSocket) {
    try {
      const socketUserKey = `${this.redisPrefix}:invitation_socket_user:${client.id}`;
      const userId = await this.redis.get(socketUserKey);
      if (userId) {
        await this.redis.del(`${this.redisPrefix}:invitation_user_socket:${userId}`);
      }
      await this.redis.del(socketUserKey);
      this.logger.log(`Invitation socket disconnected: ${client.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Invitation socket disconnect cleanup failed: ${message}`);
    }
  }

  async emitInvitationStatusToUser(params: {
    receiverUserId: number | bigint;
    invitationId: number | bigint;
    status: string;
    actorUserId: number | bigint;
    inviteFor: string;
    sellerId?: number | bigint | null;
    customerId?: number | bigint | null;
    contactId?: number | bigint | null;
  }): Promise<void> {
    const receiverId = params.receiverUserId.toString();
    const socketId = await this.redis.get(`${this.redisPrefix}:invitation_user_socket:${receiverId}`);
    if (!socketId) {
      return;
    }

    const payload = {
      invitationId: params.invitationId.toString(),
      status: params.status,
      actorUserId: params.actorUserId.toString(),
      inviteFor: params.inviteFor,
      sellerId: params.sellerId != null ? params.sellerId.toString() : null,
      customerId: params.customerId != null ? params.customerId.toString() : null,
      contactId: params.contactId != null ? params.contactId.toString() : null,
      timestamp: new Date().toISOString(),
    };

    this.server.to(socketId).emit('invitation_status_updated', payload);
    if (params.status === 'ACCEPTED') {
      this.server.to(socketId).emit('invitation_accepted', payload);
    } else if (params.status === 'REJECTED' || params.status === 'CANCELLED') {
      this.server.to(socketId).emit('invitation_rejected', payload);
    }
  }
}
