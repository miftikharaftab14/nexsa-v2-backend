import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplicationContext } from '@nestjs/common';

export class SocketIOAdapter extends IoAdapter {
  constructor(app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['authorization', 'content-type'],
      },
      transports: ['websocket', 'polling'], // Prefer websocket, fallback to polling
      allowEIO3: true, // Allow Engine.IO v3 clients (for compatibility)
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    return server;
  }
}
