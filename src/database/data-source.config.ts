import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

// Load env vars for local CLI usage if an env file exists; in ECS/RDS, values are injected via environment variables.
const envPath = process.env.DOTENV_FILE ?? `.env.${process.env.NODE_ENV || 'development'}`;
if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  config();
}

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'nexsa_v2',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

// Export for NestJS application with ConfigService
export const getDataSourceOptions = (configService: ConfigService): DataSourceOptions => {
  return {
    ...dataSourceOptions,
    host: configService.get<string>('POSTGRES_HOST'),
    port: configService.get<number>('POSTGRES_PORT'),
    username: configService.get<string>('POSTGRES_USER'),
    password: configService.get<string>('POSTGRES_PASSWORD'),
    database: configService.get<string>('POSTGRES_DB'),
    logging: configService.get<string>('NODE_ENV') === 'development',
  };
};

// Factory for asynchronous injection
export const dataSourceFactory = (configService: ConfigService): DataSource => {
  const options = getDataSourceOptions(configService);
  return new DataSource(options);
};

// Export for CLI usage
export default new DataSource(dataSourceOptions);
