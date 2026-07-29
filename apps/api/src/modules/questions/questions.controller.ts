import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuestionsService } from './questions.service';
import { createQuestionSchema, CreateQuestionInput } from '@exambd/shared-types';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Roles('admin', 'super_admin')
  @Get()
  findAll(@Query('subjectId') subjectId?: string, @Query('status') status?: string, @Query('q') search?: string) {
    return this.questionsService.findForAdmin({ subjectId, status, search });
  }

  @Roles('admin', 'super_admin')
  @Post()
  create(@Body() body: CreateQuestionInput, @CurrentUser() user: { id: string }) {
    const input = createQuestionSchema.parse(body);
    return this.questionsService.create(input, user.id);
  }

  @Roles('admin', 'super_admin')
  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.questionsService.publish(id, user.id);
  }
}
