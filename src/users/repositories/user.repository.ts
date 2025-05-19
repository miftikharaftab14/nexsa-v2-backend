import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { User } from '../entities/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { LoginDto } from 'src/auth/dto/login.dto';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(User, dataSource);
  }

  async findByPhone(data: LoginDto): Promise<User | null> {
    return this.repository.findOneBy({ phone_number: data.phone_number });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }
}
