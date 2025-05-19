export class JwtUtils {
  static getJwtOptions() {
    return {
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: '7d' },
    };
  }
}
