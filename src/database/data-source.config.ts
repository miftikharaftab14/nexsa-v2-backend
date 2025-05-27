import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nexsa_v2',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
};

// Export for NestJS application
export const getDataSourceOptions = (configService: ConfigService): DataSourceOptions => {
  return {
    ...dataSourceOptions,
    host: configService.get<string>('host'),
    port: configService.get<number>('port') || 3000,
    username: configService.get<string>('username'),
    password: configService.get<string>('password'),
    database: configService.get<string>('database'),
    logging: configService.get('NODE_ENV') === 'development',
  };
};

export const dataSourceFactory = (configService: ConfigService) => {
  const options = getDataSourceOptions(configService);
  return new DataSource(options);
};

// Default export for TypeORM CLI
export default new DataSource(dataSourceOptions);
