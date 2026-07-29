import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExamsService } from './exams.service';
import { createExamSchema, CreateExamInput } from '@exambd/shared-types';

@Controller('exams')
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Get()
  findAll() {
    return this.examsService.findPublished();
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @Post()
  create(@Body() body: CreateExamInput, @CurrentUser() user: { id: string }) {
    const input = createExamSchema.parse(body);
    return this.examsService.create(input, user.id);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.examsService.publish(id);
  }
}
