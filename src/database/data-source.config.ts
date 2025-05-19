import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const getDataSourceOptions = (configService: ConfigService): DataSourceOptions => {
  return {
    type: 'postgres',
    host: configService.get<string>('host'),
    port: configService.get<number>('port') || 8090,
    username: configService.get<string>('username'),
    password: configService.get<string>('password'),
    database: configService.get<string>('database'),
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
    synchronize: false,
  };
};

export const dataSourceFactory = (configService: ConfigService) => {
  const dataSourceOptions = getDataSourceOptions(configService);
  return new DataSource(dataSourceOptions);
};

// Create and export the DataSource instance
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.host,
  port: parseInt(process.env.port || '5432'),
  username: process.env.username,
  password: process.env.password,
  database: process.env.database,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
  synchronize: false,
});
