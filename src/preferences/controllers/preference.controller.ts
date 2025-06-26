import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PreferenceService } from '../services/preference.service';
import { Preference } from '../../common/entities/preference.entity';
import { ApiResponse as CustomApiResponse } from '../../common/interfaces/api-response.interface';

@ApiTags('Preferences')
@Controller('preferences')
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all preferences' })
  @ApiResponse({ status: 200, description: 'Preferences fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<CustomApiResponse<Preference[]>> {
    const preferences = await this.preferenceService.findAll();
    return {
      success: true,
      message: 'Preferences fetched successfully',
      status: HttpStatus.OK,
      data: preferences,
    };
  }
}
