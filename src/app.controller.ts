import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('Health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getDefault(): string {
    return this.appService.getDefault();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-03-19T12:00:00Z' },
        uptime: { type: 'number', example: 1234.56 },
        database: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'connected' },
            responseTime: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is degraded (database unavailable)',
  })
  async health() {
    const health = await this.appService.checkHealth();
    
    // Return 200 for both 'ok' and 'degraded' status
    // Docker health check will still work, but we provide more info
    // You can change this to return 503 if you want health checks to fail when DB is down
    return health;
  }
}
