import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactController } from './controllers/contact.controller';
import { ContactService } from './services/contact.service';
import { ContactRepository } from './repositories/contact.repository';
import { Contact } from './entities/contact.entity';
import { InvitationsModule } from 'src/invitations/invitations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]), InvitationsModule],
  controllers: [ContactController],
  providers: [ContactService, ContactRepository],
  exports: [ContactService, ContactRepository],
})
export class ContactsModule {}
