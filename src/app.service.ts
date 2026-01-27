import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  getDefault(): string {
    return 'API for the Nexsa application, a platfrom for sale associates and their customers.';
  }

  async checkHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'unknown',
        responseTime: 0,
      },
    };

    // Check database connectivity
    try {
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      health.database = {
        status: 'connected',
        responseTime,
      };
    } catch (error) {
      health.status = 'degraded';
      health.database = {
        status: 'disconnected',
        responseTime: 0,
      };
    }

    return health;
  }
}
