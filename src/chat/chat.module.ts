import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Broadcast } from './entities/broadcast.entity';
import { BroadcastRecipient } from './entities/broadcast-recipient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Broadcast, BroadcastRecipient])],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
