import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AttemptsService } from './attempts.service';
import {
  saveAnswerSchema,
  proctoringEventSchema,
  SaveAnswerInput,
  ProctoringEventInput,
} from '@exambd/shared-types';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('student')
@Controller()
export class AttemptsController {
  constructor(private attemptsService: AttemptsService) {}

  @Post('exams/:examId/attempts')
  start(@Param('examId') examId: string, @CurrentUser() user: { id: string }) {
    return this.attemptsService.startAttempt(examId, user.id);
  }

  @Get('attempts/:id/state')
  state(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.attemptsService.getState(id, user.id);
  }

  @Patch('attempts/:id/answers/:questionId')
  saveAnswer(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() body: SaveAnswerInput,
    @CurrentUser() user: { id: string },
  ) {
    const input = saveAnswerSchema.parse(body);
    return this.attemptsService.saveAnswer(id, questionId, user.id, input);
  }

  @Post('attempts/:id/proctoring-event')
  logEvent(
    @Param('id') id: string,
    @Body() body: ProctoringEventInput,
    @CurrentUser() user: { id: string },
  ) {
    const input = proctoringEventSchema.parse(body);
    return this.attemptsService.logProctoringEvent(id, user.id, input);
  }

  @Post('attempts/:id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.attemptsService.submit(id, user.id, false);
  }

  @Get('attempts/:id/result')
  result(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.attemptsService.getResult(id, user.id);
  }
}
