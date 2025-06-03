// src/contacts/services/contact.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContactRepository } from '../repositories/contact.repository';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { Contact } from '../entities/contact.entity';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { Messages } from 'src/common/enums/messages.enum';
import { LogMessages, LogContexts } from 'src/common/enums/logging.enum';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { HttpStatus } from '@nestjs/common';
import { ContactStatus } from 'src/common/enums/contact-status.enum';
import { IInvitationService } from 'src/invitations/interfaces/contact-invitation.interface';
import { InjectionToken } from 'src/common/constants/injection-tokens';
import { DataSource } from 'typeorm';
import { IContactUpdate } from '../interfaces/IContactUpdate.interface';

@Injectable()
export class ContactService implements IContactUpdate {
  private readonly logger = new Logger(LogContexts.CONTACT);

  constructor(
    private readonly contactRepo: ContactRepository,
    @Inject(InjectionToken.INVITATION_SERVICE)
    private readonly invitationService: IInvitationService,
    private dataSource: DataSource,
  ) { }

  async create(createContactDto: CreateContactDto): Promise<ApiResponse<Contact>> {
    try {
      this.logger.debug(LogMessages.CONTACT_CREATE_ATTEMPT);

      // Set default status if not provided
      const contactData = {
        ...createContactDto,
        status: createContactDto.status || ContactStatus.NEW,
        seller_id: BigInt(createContactDto.seller_id), // Convert to BigInt
      };

      const contact = await this.contactRepo.create({
        ...contactData,
        invited_user_id: contactData.invited_user_id
          ? BigInt(contactData.invited_user_id)
          : undefined,
      });
      this.logger.log(LogMessages.CONTACT_CREATE_SUCCESS, contact.id);

      return {
        success: true,
        message: Messages.CONTACT_CREATED,
        status: HttpStatus.CREATED,
        data: contact,
      };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.CONTACT_CREATE_FAILED, error);
      throw new BusinessException(Messages.CONTACT_CREATION_FAILED, 'CONTACT_CREATION_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async findAll(): Promise<ApiResponse<Contact[]>> {
    try {
      this.logger.debug(LogMessages.CONTACT_FETCH_ATTEMPT);
      const contacts = await this.contactRepo.findAll();
      this.logger.log(LogMessages.CONTACT_FETCH_SUCCESS);
      return {
        success: true,
        message: Messages.CONTACTS_FETCHED,
        status: HttpStatus.OK,
        data: contacts,
      };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.CONTACT_FETCH_FAILED, error);
      throw new BusinessException(Messages.CONTACT_FETCH_FAILED, 'CONTACT_FETCH_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async findOne(id: number): Promise<ApiResponse<Contact>> {
    try {
      this.logger.debug(LogMessages.CONTACT_FETCH_ATTEMPT, id);
      const contact = await this.contactRepo.findOneById(id);
      if (!contact) {
        throw new BusinessException(Messages.CONTACT_NOT_FOUND, 'CONTACT_NOT_FOUND');
      }
      this.logger.log(LogMessages.CONTACT_FETCH_SUCCESS, id);
      return {
        success: true,
        message: Messages.CONTACT_FETCHED,
        status: HttpStatus.OK,
        data: contact,
      };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.CONTACT_FETCH_FAILED, error);
      throw new BusinessException(Messages.CONTACT_FETCH_FAILED, 'CONTACT_FETCH_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async update(id: number, updateContactDto: UpdateContactDto): Promise<ApiResponse<Contact>> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      this.logger.debug(LogMessages.CONTACT_UPDATE_ATTEMPT, id);
      const contact = await this.contactRepo.findById(id);
      if (!contact) {
        throw new BusinessException(Messages.CONTACT_NOT_FOUND, 'CONTACT_NOT_FOUND');
      }
      // If status is changing to INVITED, create invitation
      if (
        updateContactDto.status === ContactStatus.INVITED &&
        contact.status === ContactStatus.NEW
      ) {
        await this.invitationService.createInvitation(contact);
      }
      // If status is changing to INVITED, create invitation
      if (
        updateContactDto.status === ContactStatus.CANCELLED &&
        contact.status === ContactStatus.INVITED
      ) {
        await this.invitationService.cancelInvitation(contact.id);
      }
      const updatedContact = await this.contactRepo.update(id, {
        ...updateContactDto,
        ...(updateContactDto.status && {
          status:
            updateContactDto.status === ContactStatus.CANCELLED
              ? ContactStatus.NEW
              : updateContactDto.status,
        }),
        seller_id: updateContactDto.seller_id ? BigInt(updateContactDto.seller_id) : undefined,
        invited_user_id: updateContactDto.invited_user_id
          ? BigInt(updateContactDto.invited_user_id)
          : undefined,
      });
      if (!updatedContact) {
        throw new BusinessException(Messages.CONTACT_UPDATE_FAILED, 'CONTACT_UPDATE_FAILED');
      }
      this.logger.log(LogMessages.CONTACT_UPDATE_SUCCESS, id);
      await queryRunner.commitTransaction();
      return {
        success: true,
        message: Messages.CONTACT_UPDATED,
        status: HttpStatus.OK,
        data: updatedContact,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(LogMessages.CONTACT_UPDATE_FAILED, error);
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(Messages.CONTACT_UPDATE_FAILED, 'CONTACT_UPDATE_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      this.logger.debug(LogMessages.CONTACT_DELETE_ATTEMPT, id);
      const contact = await this.contactRepo.findOneById(id);
      if (!contact) {
        throw new BusinessException(Messages.CONTACT_NOT_FOUND, 'CONTACT_NOT_FOUND');
      }
      await this.contactRepo.delete(id);
      this.logger.log(LogMessages.CONTACT_DELETE_SUCCESS, id);
      return {
        success: true,
        message: Messages.CONTACT_DELETED,
        status: HttpStatus.OK,
        data: null,
      };
    } catch (error) {
      this.logger.error(LogMessages.CONTACT_DELETE_FAILED, error);
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(Messages.CONTACT_DELETE_FAILED, 'CONTACT_DELETE_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  async findBySellerId(sellerId: number): Promise<ApiResponse<Contact[]>> {
    try {
      this.logger.debug(LogMessages.CONTACT_FETCH_ATTEMPT, sellerId);
      const contacts = await this.contactRepo.findBySellerId(sellerId);
      this.logger.log(LogMessages.CONTACT_FETCH_SUCCESS);
      return {
        success: true,
        message: Messages.CONTACTS_FETCHED,
        status: HttpStatus.OK,
        data: contacts,
      };
    } catch (error) {
      this.logger.error(LogMessages.CONTACT_FETCH_FAILED, error);
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(Messages.CONTACT_FETCH_FAILED, 'CONTACT_FETCH_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async findAllByInvitedUserId(invitiedUserId: bigint): Promise<Contact[]> {
    try {
      this.logger.debug(LogMessages.CONTACT_FETCH_ATTEMPT);

      const contacts = await this.contactRepo.findByInvitedUserId(invitiedUserId);


      this.logger.log(LogMessages.CONTACT_FETCH_SUCCESS);
      return contacts;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.CONTACT_FETCH_FAILED, error);
      throw new BusinessException(Messages.CONTACT_FETCH_FAILED, 'CONTACT_FETCH_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
