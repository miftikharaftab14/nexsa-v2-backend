import { DataSource } from 'typeorm';
import { PreferencesSeed } from './preferences.seed';

export class SeedRunner {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('Starting database seeding...');

    try {
      // Run seeds in order
      const preferencesSeed = new PreferencesSeed(this.dataSource);
      await preferencesSeed.run();

      console.log('All seeds completed successfully!');
    } catch (error) {
      console.error('Error during seeding:', error);
      throw error;
    }
  }
}
