import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

interface SupabaseJwtPayload {
  sub: string;   // auth.users.id — matches public.users.id
  email?: string;
  role?: string; // supabase's own "authenticated"/"anon", not our app role
}

// Verifies the JWT that Supabase Auth issued on login, using the project's JWT secret
// (HS256, simplest option) — for RS256/JWKS rotation, swap secretOrKey for jwks-rsa's
// passportJwtSecret() pointed at {SUPABASE_URL}/auth/v1/.well-known/jwks.json.
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'supabase-jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: SupabaseJwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || !user.isActive) {
      return null; // AuthGuard will translate this into a 401
    }
    // This object becomes `request.user` and is what @CurrentUser() and RolesGuard read.
    return {
      id: user.id,
      email: payload.email,
      role: user.role.name, // 'super_admin' | 'admin' | 'student'
      fullName: user.fullName,
    };
  }
}
