import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '@exambd/shared-types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterInput) {
    const input = registerSchema.parse(body);
    return this.authService.register(input);
  }

  @Post('login')
  login(@Body() body: LoginInput) {
    const input = loginSchema.parse(body);
    return this.authService.login(input);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }
}
