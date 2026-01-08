// src/contacts/controllers/contact.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  HttpStatus,
} from '@nestjs/common';
import { ContactService } from '../services/contact.service';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { CustomValidationPipe } from 'src/common/pipes/validation.pipe';
import {
  _200_contacts,
  _200_contact,
  _201_contact,
  _400_contact,
  _404_contact,
} from '../documentaion/api.response';
import { Contact } from '../entities/contact.entity';
import { ApiResponse as CustomApiResponse } from 'src/common/interfaces/api-response.interface';
import { Messages } from 'src/common/enums/messages.enum';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { CurrentUserType } from 'src/common/types/current-user.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { BlocksService } from 'src/blocks/blocks.service';

@ApiTags('Contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly blocksService: BlocksService,
  ) {}

  @Post()
  @ApiOperation({ summary: Descriptions.CREATE_CONTACT_SUMMARY })
  @ApiResponse(_201_contact)
  @ApiResponse(_400_contact)
  @UsePipes(new CustomValidationPipe())
  async create(@Body() createContactDto: CreateContactDto) {
    const contact = await this.contactService.create(createContactDto);
    return {
      success: true,
      message: Messages.CONTACT_CREATED,
      status: HttpStatus.CREATED,
      data: contact,
    };
  }

  @Get()
  @ApiOperation({ summary: Descriptions.GET_ALL_CONTACTS_SUMMARY })
  @ApiResponse(_200_contacts)
  async findAll() {
    const contacts = await this.contactService.findAll();
    return {
      success: true,
      message: Messages.CONTACTS_FETCHED,
      status: HttpStatus.OK,
      data: contacts,
    };
  }
  @Get('get-sellers')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get all accepted sellers invited by the logged-in customer' })
  @ApiResponse(_200_contacts)
  async findAllSelelrsByCustomer(@CurrentUser() user: CurrentUserType) {
    return this.contactService.findAllSelelrsByCustomer(user.userId);
  }
  @Get('get-seller-chats')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get accepted sellers with block status for the logged-in customer' })
  @ApiResponse(_200_contacts)
  async findSellerChats(@CurrentUser() user: CurrentUserType) {
    const sellers = await this.contactService.findSellersForCustomerUnfiltered(user.userId);
    const enriched = await Promise.all(
      sellers.map(async (seller: any) => {
        const sellerId = seller.user_id || seller.id;
        const relation = await this.blocksService.getBlockRelation(Number(user.userId), Number(sellerId));
        return {
          ...seller,
          isBlocked: relation.isBlocked,
          blockedBy: relation.blockedBy,
        };
      }),
    );
    return {
      success: true,
      message: Messages.CONTACTS_FETCHED,
      status: HttpStatus.OK,
      data: enriched,
    };
  }
  @Get('accepted-with-preferences')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Get all accepted customer invited by the logged-in sellers' })
  @ApiResponse(_200_contacts)
  async findAcceptedContactsWithPreferences(@CurrentUser() user: CurrentUserType) {
    const contacts = await this.contactService.findContactsBySeller(user.userId);
    
    // Add blocking information to each contact
    const contactsWithBlocking = await Promise.all(
      contacts
        .filter(contact => contact.invited_user) // Filter out contacts with null invited_user
        .map(async (contact) => {
          const customerId = contact.invited_user.id;
          const isSellerBlockedCustomer = await this.blocksService.isBlocked(user.userId, customerId);
          const isCustomerBlockedSeller = await this.blocksService.isBlocked(customerId, user.userId);
          
          return {
            ...contact,
            isBlocked: isSellerBlockedCustomer || isCustomerBlockedSeller,
            blockingDetails: {
              sellerBlockedCustomer: isSellerBlockedCustomer,
              customerBlockedSeller: isCustomerBlockedSeller,
            }
          };
        })
    );
    
    return contactsWithBlocking;
  }

  @Get(':id')
  @ApiOperation({ summary: Descriptions.GET_CONTACT_BY_ID_SUMMARY })
  @ApiResponse(_200_contact)
  @ApiResponse(_404_contact)
  async findOne(@Param('id') id: number) {
    const contact = await this.contactService.findOne(id);
    return {
      success: true,
      message: Messages.CONTACT_FETCHED,
      status: HttpStatus.OK,
      data: contact,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: Descriptions.UPDATE_CONTACT_SUMMARY })
  @ApiResponse(_200_contact)
  @ApiResponse(_404_contact)
  @ApiResponse(_400_contact)
  async update(
    @Param('id') id: number,
    @Body(new CustomValidationPipe()) updateContactDto: UpdateContactDto,
  ) {
    const contact = await this.contactService.update(id, updateContactDto);
    return {
      success: true,
      message: Messages.CONTACT_UPDATED,
      status: HttpStatus.OK,
      data: contact,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: Descriptions.DELETE_CONTACT_SUMMARY })
  @ApiResponse(_200_contact)
  @ApiResponse(_404_contact)
  async remove(@Param('id') id: number) {
    await this.contactService.delete(id);
    return {
      success: true,
      message: Messages.CONTACT_DELETED,
      status: HttpStatus.OK,
      data: null,
    };
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get contacts by seller ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contacts fetched successfully',
    type: [Contact],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No contacts found',
  })
  async findBySellerId(@Param('sellerId') sellerId: number): Promise<CustomApiResponse<Contact[]>> {
    const contacts = await this.contactService.findBySellerId(sellerId);
    return {
      success: true,
      message: Messages.CONTACTS_FETCHED,
      status: HttpStatus.OK,
      data: contacts.data,
    };
  }
}
