import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GalleryImagesService } from '../gallery-image/gallery-images.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger('AdminService');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly galleryImagesService: GalleryImagesService,
  ) {}

  async validateAdmin(username: string, password: string): Promise<boolean> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      this.logger.error('Admin credentials not configured');
      throw new UnauthorizedException('Admin credentials not configured');
    }

    return username === adminEmail && password === adminPassword;
  }

  async login(email: string, password: string): Promise<{ access_token: string }> {
    const isValid = await this.validateAdmin(email, password);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload = { email, role: 'admin' };
    const access_token = this.jwtService.sign(payload);

    this.logger.log(`Admin ${email} logged in successfully`);
    return { access_token };
  }

  async getReportedImages(): Promise<any[]> {
    return await this.galleryImagesService.getReportedImages();
  }

  async deleteReportedImage(imageId: number): Promise<void> {
    return await this.galleryImagesService.deleteReportedImage(imageId);
  }
}

