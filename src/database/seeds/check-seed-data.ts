import { DataSource } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import dataSourceConfig from '../data-source.config';

async function checkSeedData() {
  let dataSource: DataSource | undefined;
  try {
    dataSource = new DataSource(dataSourceConfig.options);
    await dataSource.initialize();

    const categoryRepository = dataSource.getRepository(Category);
    const count = await categoryRepository.count({
      where: { systemGenerated: true },
    });

    if (count === 0) {
      console.log('No seed data found');
      process.exit(1); // Exit with code 1 to indicate seeds needed
    } else {
      console.log(`Found ${count} seeded categories`);
      process.exit(0); // Exit with code 0 to indicate seeds not needed
    }
  } catch (error) {
    console.error('Error checking seed data:', error);
    process.exit(1); // Exit with code 1 on error
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

checkSeedData();
