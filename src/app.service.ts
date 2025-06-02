import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getDefault(): string {
    return 'API for the Nexsa application, a platfrom for sale associates and their customers.';
  }
}
