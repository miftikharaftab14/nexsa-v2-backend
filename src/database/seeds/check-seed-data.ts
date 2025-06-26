import { DataSource, IsNull, Not } from 'typeorm';
import dataSourceConfig from '../data-source.config';
import { Preference } from 'src/common/entities/preference.entity';

async function checkSeedData() {
  let dataSource: DataSource | undefined;
  try {
    dataSource = new DataSource(dataSourceConfig.options);
    await dataSource.initialize();

    const categoryRepository = dataSource.getRepository(Preference);
    const count = await categoryRepository.count({
      where: { name: Not(IsNull()) },
    });

    if (count === 0) {
      console.log('No seed data found');
      process.exit(1); // Exit with code 1 to indicate seeds needed
    } else {
      console.log(`Found ${count} seeded Preference`);
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
