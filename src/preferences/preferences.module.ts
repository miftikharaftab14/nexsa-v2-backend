import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Preference } from '../common/entities/preference.entity';
import { PreferenceRepository } from './entities/preference.repository';
import { PreferenceService } from './services/preference.service';
import { PreferenceController } from './controllers/preference.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Preference])],
  controllers: [PreferenceController],
  providers: [PreferenceService, PreferenceRepository],
  exports: [PreferenceService, PreferenceRepository],
})
export class PreferencesModule {}
