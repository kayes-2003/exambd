import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterInput, LoginInput } from '@exambd/shared-types';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    // service_role key: server-only, bypasses RLS — never exposed to the frontend.
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async register(input: RegisterInput) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      phone: input.phone,
      email_confirm: false,
      user_metadata: { full_name: input.fullName },
    });
    if (error) throw error;

    // public.users row is created automatically by the on_auth_user_created DB trigger,
    // but we set the full name / phone explicitly here in case metadata parsing lags.
    await this.prisma.user.update({
      where: { id: data.user!.id },
      data: { fullName: input.fullName, phone: input.phone },
    });

    return { userId: data.user!.id, message: 'Verification email sent' };
  }

  async login(input: LoginInput) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) throw error;
    return { accessToken: data.session?.access_token, refreshToken: data.session?.refresh_token };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
  }
}
