import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShuffleService, seededRandom } from './services/shuffle.service';
import { ScoringService } from './services/scoring.service';
import { randomUUID } from 'crypto';
import type { SaveAnswerInput, ProctoringEventInput } from '@exambd/shared-types';

@Injectable()
export class AttemptsService {
  constructor(
    private prisma: PrismaService,
    private shuffle: ShuffleService,
    private scoring: ScoringService,
  ) {}

  // ---- Start / resume an attempt ----
  async startAttempt(examId: string, studentId: string) {
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      include: { examSubjects: true, examQuestions: true },
    });

    const existing = await this.prisma.examAttempt.findFirst({
      where: { examId, studentId, status: 'in_progress' },
    });
    if (existing) return this.getState(existing.id, studentId);

    const attemptCount = await this.prisma.examAttempt.count({ where: { examId, studentId } });
    if (attemptCount >= exam.maxAttempts) {
      throw new ForbiddenException('Maximum attempts reached for this exam');
    }

    const seed = randomUUID();
    const rng = seededRandom(seed);

    // Build the question pool: curated list if present, else pull per-subject quota.
    let pool: { id: string }[];
    if (exam.examQuestions.length > 0) {
      pool = exam.examQuestions.map((q) => ({ id: q.questionId }));
    } else {
      pool = [];
      for (const es of exam.examSubjects) {
        const subjectQuestions = await this.prisma.question.findMany({
          where: { subjectId: es.subjectId, status: 'published' },
          select: { id: true },
        });
        pool.push(...this.shuffle.shuffleQuestions(subjectQuestions, es.questionCount, rng));
      }
    }

    const chosen = exam.isRandomized
      ? this.shuffle.shuffleQuestions(pool, exam.totalQuestions, rng)
      : pool.slice(0, exam.totalQuestions);

    const endAt = new Date(Date.now() + exam.durationMinutes * 60_000);

    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        attemptNumber: attemptCount + 1,
        status: 'in_progress',
      },
    });

    await this.prisma.examAttemptQuestion.createMany({
      data: chosen.map((q, i) => ({ attemptId: attempt.id, questionId: q.id, displayOrder: i })),
    });

    for (const q of chosen) {
      const options = await this.prisma.questionOption.findMany({ where: { questionId: q.id } });
      const labeled = this.shuffle.shuffleOptions(options, rng);
      await this.prisma.examAttemptOption.createMany({
        data: labeled.map((l) => ({
          attemptId: attempt.id,
          questionId: q.id,
          optionId: l.optionId,
          displayLabel: l.displayLabel,
        })),
      });
    }

    // endAt is derived (started_at + duration) rather than stored redundantly here;
    // exposed to the client via getState() below.
    void endAt;

    return this.getState(attempt.id, studentId);
  }

  // ---- Resume state (server-authoritative timer + palette) ----
  async getState(attemptId: string, studentId: string) {
    const attempt = await this.prisma.examAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: { exam: true },
    });
    if (attempt.studentId !== studentId) throw new ForbiddenException();

    const endAt = new Date(attempt.startedAt.getTime() + attempt.exam.durationMinutes * 60_000);
    const remainingSeconds = Math.max(0, Math.floor((endAt.getTime() - Date.now()) / 1000));

    const questions = await this.prisma.examAttemptQuestion.findMany({
      where: { attemptId },
      orderBy: { displayOrder: 'asc' },
    });
    const answers = await this.prisma.studentAnswer.findMany({ where: { attemptId } });
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    return {
      attemptId: attempt.id,
      examTitle: attempt.exam.title,
      endAt: endAt.toISOString(),
      remainingSeconds,
      currentQuestions: questions.map((q) => {
        const a = answerMap.get(q.questionId);
        return {
          questionId: q.questionId,
          displayOrder: q.displayOrder,
          isAnswered: !!a?.selectedOptionId,
          isMarkedForReview: !!a?.isMarkedForReview,
          isVisited: !!a?.isVisited,
        };
      }),
    };
  }

  // ---- Autosave one answer ----
  async saveAnswer(attemptId: string, questionId: string, studentId: string, input: SaveAnswerInput) {
    const attempt = await this.prisma.examAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    if (attempt.studentId !== studentId) throw new ForbiddenException();
    if (attempt.status !== 'in_progress') throw new BadRequestException('Attempt is not in progress');

    if (input.selectedOptionId) {
      // Validate the option actually belongs to THIS attempt's shuffled set for this question —
      // prevents a tampered request from submitting an arbitrary option_id.
      const valid = await this.prisma.examAttemptOption.findFirst({
        where: { attemptId, questionId, optionId: input.selectedOptionId },
      });
      if (!valid) throw new BadRequestException('Invalid option for this attempt');
    }

    await this.prisma.studentAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: {
        attemptId,
        questionId,
        selectedOptionId: input.selectedOptionId,
        isMarkedForReview: input.isMarkedForReview ?? false,
        isVisited: true,
        timeSpentSeconds: input.timeSpentSeconds,
        answeredAt: input.selectedOptionId ? new Date() : null,
      },
      update: {
        selectedOptionId: input.selectedOptionId,
        isMarkedForReview: input.isMarkedForReview ?? undefined,
        isVisited: true,
        timeSpentSeconds: { increment: input.timeSpentSeconds },
        answeredAt: input.selectedOptionId ? new Date() : null,
      },
    });

    return this.getState(attemptId, studentId);
  }

  async logProctoringEvent(attemptId: string, studentId: string, input: ProctoringEventInput) {
    const attempt = await this.prisma.examAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    if (attempt.studentId !== studentId) throw new ForbiddenException();
    return this.prisma.proctoringEvent.create({
      data: { attemptId, eventType: input.eventType, metadata: input.metadata },
    });
  }

  // ---- Submit (manual or auto) ----
  async submit(attemptId: string, studentId: string, auto = false) {
    const attempt = await this.prisma.examAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    if (attempt.studentId !== studentId && !auto) throw new ForbiddenException();
    if (attempt.status !== 'in_progress') return attempt; // idempotent

    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: { status: auto ? 'auto_submitted' : 'submitted', submittedAt: new Date() },
    });

    // In production this is enqueued to BullMQ (see apps/worker) so heavy negative-marking
    // calculations never block the HTTP request. Called inline here for scaffold clarity.
    return this.scoring.scoreAttempt(attemptId);
  }

  async getResult(attemptId: string, studentId: string) {
    const attempt = await this.prisma.examAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: { exam: true },
    });
    if (attempt.studentId !== studentId) throw new ForbiddenException();
    if (attempt.status === 'in_progress') throw new BadRequestException('Attempt not yet submitted');
    return attempt;
  }
}
