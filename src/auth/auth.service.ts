import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(payload: { id: string; email: string; type: string }): string {
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return { valid: true, decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}
