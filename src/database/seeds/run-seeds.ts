import { DataSource } from 'typeorm';
import { CategoriesSeed } from './categories.seed';

export class SeedRunner {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('Starting database seeding...');

    try {
      // Run seeds in order
      const categoriesSeed = new CategoriesSeed(this.dataSource);
      await categoriesSeed.run();

      console.log('All seeds completed successfully!');
    } catch (error) {
      console.error('Error during seeding:', error);
      throw error;
    }
  }
}
