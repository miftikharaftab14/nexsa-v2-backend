import { Injectable, Logger } from '@nestjs/common';
import { PreferenceRepository } from '../entities/preference.repository';
import { Preference } from '../../common/entities/preference.entity';
import { LogMessages, LogContexts } from '../../common/enums/logging.enum';

@Injectable()
export class PreferenceService {
  private readonly logger = new Logger(LogContexts.PREFERENCE);

  constructor(private readonly preferenceRepository: PreferenceRepository) {}

  async findAll(userId: bigint): Promise<Preference[]> {
    try {
      this.logger.debug(LogMessages.PREFERENCE_FETCH_ATTEMPT);
      const preferences = await this.preferenceRepository.findAllPreferences(userId);
      this.logger.log(
        LogMessages.PREFERENCE_FETCH_SUCCESS,
        `Found ${preferences.length} preferences`,
      );
      return preferences;
    } catch (error) {
      this.logger.error(
        LogMessages.PREFERENCE_FETCH_FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async findOne(id: number | bigint): Promise<Preference | null> {
    try {
      this.logger.debug(LogMessages.PREFERENCE_FETCH_ATTEMPT, id);
      const preference = await this.preferenceRepository.findOneById(id);
      if (!preference) {
        this.logger.warn(LogMessages.PREFERENCE_NOT_FOUND, id);
      } else {
        this.logger.log(LogMessages.PREFERENCE_FETCH_SUCCESS, id);
      }
      return preference;
    } catch (error) {
      this.logger.error(
        LogMessages.PREFERENCE_FETCH_FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async findByName(name: string): Promise<Preference | null> {
    try {
      this.logger.debug(LogMessages.PREFERENCE_FETCH_ATTEMPT, `name: ${name}`);
      const preference = await this.preferenceRepository.findByName(name);
      if (!preference) {
        this.logger.warn(LogMessages.PREFERENCE_NOT_FOUND, `name: ${name}`);
      } else {
        this.logger.log(LogMessages.PREFERENCE_FETCH_SUCCESS, `name: ${name}`);
      }
      return preference;
    } catch (error) {
      this.logger.error(
        LogMessages.PREFERENCE_FETCH_FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
  async addNew(name: string, userId: bigint): Promise<Preference | null> {
    try {
      this.logger.debug(LogMessages.PREFERENCE_FETCH_ATTEMPT, `name: ${name}`);

      return this.preferenceRepository.addNew(name, userId);
    } catch (error) {
      this.logger.error(
        LogMessages.PREFERENCE_FETCH_FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
