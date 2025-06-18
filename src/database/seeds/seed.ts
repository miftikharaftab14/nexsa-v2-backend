import { DataSource } from 'typeorm';
import { SeedRunner } from './run-seeds';
import dataSourceConfig from '../data-source.config';

async function runSeeds() {
  let dataSource: DataSource | undefined;
  try {
    dataSource = new DataSource(dataSourceConfig.options);
    await dataSource.initialize();
    console.log('Database connection established');

    const seedRunner = new SeedRunner(dataSource);
    await seedRunner.run();

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runSeeds();
