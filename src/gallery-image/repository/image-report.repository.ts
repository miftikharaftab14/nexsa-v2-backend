import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageReport } from '../entities/image-report.entity';

@Injectable()
export class ImageReportRepository {
  constructor(
    @InjectRepository(ImageReport)
    private readonly repository: Repository<ImageReport>,
  ) {}

  async create(data: Partial<ImageReport>): Promise<ImageReport> {
    const report = this.repository.create(data);
    return await this.repository.save(report);
  }

  async findByImageId(imageId: number): Promise<ImageReport[]> {
    return await this.repository.find({
      where: { galleryImageId: imageId },
      relations: ['customer', 'galleryImage'],
    });
  }

  async findByCustomerId(customerId: number): Promise<ImageReport[]> {
    return await this.repository.find({
      where: { customerId },
      relations: ['galleryImage'],
    });
  }

  async findByImageAndCustomer(imageId: number, customerId: number): Promise<ImageReport | null> {
    return await this.repository.findOne({
      where: { galleryImageId: imageId, customerId },
    });
  }

  async getReportedImagesWithCount(): Promise<any[]> {
    return await this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.galleryImage', 'galleryImage')
      .select([
        'galleryImage.id as id',
        'galleryImage.media_file_id as "mediaFileId"',
        'COUNT(report.id) as count_of_reports',
      ])
      .groupBy('galleryImage.id, galleryImage.media_file_id')
      .getRawMany();
  }

  async deleteByImageId(imageId: number): Promise<void> {
    await this.repository.delete({ galleryImageId: imageId });
  }
}

