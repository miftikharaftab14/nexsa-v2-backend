import { DataSource } from 'typeorm';
import dataSourceConfig from '../data-source.config';

async function debugSchema() {
  let dataSource: DataSource | undefined;
  try {
    dataSource = new DataSource(dataSourceConfig.options);
    await dataSource.initialize();
    console.log('Database connection established');

    // Check the actual schema of the categories table
    const result = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      ORDER BY ordinal_position;
    `);

    console.log('Categories table schema:');
    console.table(result);

    // Check if there are any existing categories
    const categories = await dataSource.query('SELECT * FROM categories LIMIT 5');
    console.log('\nExisting categories:');
    console.table(categories);
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

debugSchema();
