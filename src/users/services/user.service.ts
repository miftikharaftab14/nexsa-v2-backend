import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { LoginDto } from 'src/auth/dto/login.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  create(data: CreateUserDto): Promise<User> {
    return this.userRepo.create(data);
  }

  findAll(): Promise<User[]> {
    return this.userRepo.findAll();
  }

  findOne(id: number): Promise<User | null> {
    return this.userRepo.findOneById(id);
  }

  update(id: number, data: UpdateUserDto) {
    return this.userRepo.update(id, data);
  }

  delete(id: number) {
    return this.userRepo.delete(id);
  }

  findByPhone(data: LoginDto): Promise<User | null> {
    return this.userRepo.findByPhone(data);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email);
  }
}
