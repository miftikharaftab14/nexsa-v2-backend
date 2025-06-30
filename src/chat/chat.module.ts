import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Broadcast } from './entities/broadcast.entity';
import { BroadcastRecipient } from './entities/broadcast-recipient.entity';
import { ChatController } from './chat.controller';
import { UserModule } from 'src/users/user.module';
import { ContactsModule } from 'src/contacts/contacts.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { Contact } from 'src/contacts/entities/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Broadcast, BroadcastRecipient, Contact]),
    UserModule,
    ContactsModule,
    AuthModule,
    JwtModule.register({}),
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
