import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepo: Repository<Block>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async isBlocked(userA: number | bigint, userB: number | bigint): Promise<boolean> {
    const cnt = await this.blockRepo.count({
      where: [
        { blockerId: Number(userA), blockedId: Number(userB) },
        // { blockerId: Number(userB), blockedId: Number(userA) },
      ],
    });
    return cnt > 0;
  }

  async block(blockerId: number | bigint, blockedId: number | bigint, reason?: string) {
    const exists = await this.blockRepo.findOne({
      where: { blockerId: Number(blockerId), blockedId: Number(blockedId) },
    });
    if (exists) throw new ConflictException('Already blocked');
    const entity = this.blockRepo.create({ blockerId: Number(blockerId), blockedId: Number(blockedId), reason });
    return this.blockRepo.save(entity);
  }

  async unblock(blockerId: number | bigint, blockedId: number | bigint) {
    const res = await this.blockRepo.delete({ blockerId: Number(blockerId), blockedId: Number(blockedId) });
    if (!res.affected) throw new NotFoundException('Block not found');
    return true;
  }

  async listBlockedBy(userId: number | bigint) {
    const blocks = await this.blockRepo.find({ 
      where: { blockerId: Number(userId) }
    });
    
    // Fetch user information for each blocked user
    const blocksWithUsers = await Promise.all(
      blocks.map(async (block) => {
        const blockedUser = await this.userRepo.findOne({
          where: { id: BigInt(block.blockedId) }
        });
        
        return {
          id: block.id,
          blockerId: block.blockerId,
          blockedId: block.blockedId,
          reason: block.reason,
          createdAt: block.createdAt,
          updatedAt: block.updatedAt,
          blockedUser: blockedUser
        };
      })
    );
    
    return blocksWithUsers;
  }

  async getBlockRelation(
    userA: number | bigint,
    userB: number | bigint,
  ): Promise<{ isBlocked: boolean; blockedBy: string | null }> {
    const record = await this.blockRepo.findOne({
      where: [
        { blockerId: Number(userA), blockedId: Number(userB) },
        // { blockerId: Number(userB), blockedId: Number(userA) },
      ],
      select: ['blockerId'],
    });
    if (!record) return { isBlocked: false, blockedBy: null };
    return { isBlocked: true, blockedBy: String(record.blockerId) };
  }
}


