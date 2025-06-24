import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger('ChatService');

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async createMessage(
    contact: Contact,
    sender: User,
    messageType: MessageType,
    content?: string,
    mediaKey?: string,
  ): Promise<Message> {
    const newMessage = this.messageRepository.create({
      contact,
      sender,
      messageType,
      content,
      mediaKey,
    });
    return this.messageRepository.save(newMessage);
  }

  async getConversation(contactId: bigint): Promise<Message[]> {
    return this.messageRepository.find({
      where: { contactId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }
}
