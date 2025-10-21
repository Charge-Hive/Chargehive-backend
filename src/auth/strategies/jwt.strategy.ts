import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use Supabase JWT secret for validation
      secretOrKey: configService.get('SUPABASE_JWT_SECRET') || configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Supabase JWT payload structure
    if (payload.sub) {
      return {
        id: payload.sub,
        email: payload.email,
        type: payload.user_metadata?.type || 'provider',
      };
    }

    // Fallback to custom JWT payload structure
    if (!payload.id || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.id,
      email: payload.email,
      type: payload.type || payload.user_metadata?.type,
    };
  }
}
