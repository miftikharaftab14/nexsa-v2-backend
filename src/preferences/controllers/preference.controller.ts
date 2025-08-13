import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PreferenceService } from '../services/preference.service';
import { Preference } from '../../common/entities/preference.entity';
import { ApiResponse as CustomApiResponse } from '../../common/interfaces/api-response.interface';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { CurrentUserType } from 'src/common/types/current-user.interface';
import { UpdatePreferencesDto } from '../entities/update-preferences.dto';

@ApiTags('Preferences')
@Controller('preferences')
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all preferences' })
  @ApiResponse({ status: 200, description: 'Preferences fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<CustomApiResponse<Preference[]>> {
    const preferences = await this.preferenceService.findAll(currentUser.userId);
    return {
      success: true,
      message: 'Preferences fetched successfully',
      status: HttpStatus.OK,
      data: preferences,
    };
  }
  @Post()
  @ApiOperation({ summary: 'add preferences' })
  @ApiResponse({ status: 200, description: 'Preferences added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addNew(
    @CurrentUser() currentUser: CurrentUserType,
    @Body() preferencesDto: UpdatePreferencesDto,
  ): Promise<CustomApiResponse<Preference | null>> {
    const preferences = await this.preferenceService.addNew(
      preferencesDto.name,
      currentUser.userId,
    );
    return {
      success: true,
      message: 'Preferences fetched successfully',
      status: HttpStatus.OK,
      data: preferences,
    };
  }
}
