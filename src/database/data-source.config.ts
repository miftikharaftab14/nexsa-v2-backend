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

/**
 * Determines if SSL should be enabled for the database connection.
 * SSL is required for AWS RDS but not for localhost/docker-compose connections.
 */
const shouldEnableSSL = (host: string | undefined): boolean | { rejectUnauthorized: false } => {
  if (!host) return false;
  const localhostHosts = ['localhost', 'db', '127.0.0.1'];
  return localhostHosts.includes(host) ? false : { rejectUnauthorized: false };
};

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
  ssl: shouldEnableSSL(process.env.POSTGRES_HOST),
};

/**
 * Gets TypeORM DataSource options using ConfigService.
 * Used by NestJS application for dependency injection.
 */
export const getDataSourceOptions = (configService: ConfigService): DataSourceOptions => {
  const host = configService.get<string>('POSTGRES_HOST');
  
  return {
    ...dataSourceOptions,
    host,
    port: configService.get<number>('POSTGRES_PORT'),
    username: configService.get<string>('POSTGRES_USER'),
    password: configService.get<string>('POSTGRES_PASSWORD'),
    database: configService.get<string>('POSTGRES_DB'),
    logging: configService.get<string>('NODE_ENV') === 'development',
    ssl: shouldEnableSSL(host),
  };
};

/**
 * Factory function for creating a DataSource instance.
 * Used for asynchronous dependency injection in NestJS.
 */
export const dataSourceFactory = (configService: ConfigService): DataSource => {
  const options = getDataSourceOptions(configService);
  return new DataSource(options);
};

/**
 * Default DataSource instance for CLI usage (migrations, seeds, etc.)
 */
export default new DataSource(dataSourceOptions);
