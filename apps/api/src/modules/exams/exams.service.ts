import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamInput } from '@exambd/shared-types';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  findPublished() {
    return this.prisma.exam.findMany({
      where: { status: 'published' },
      orderBy: { startTime: 'asc' },
    });
  }

  create(input: CreateExamInput, createdBy: string) {
    const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return this.prisma.exam.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        durationMinutes: input.durationMinutes,
        startTime: input.startTime ? new Date(input.startTime) : undefined,
        endTime: input.endTime ? new Date(input.endTime) : undefined,
        totalQuestions: input.totalQuestions,
        isRandomized: input.isRandomized,
        negativeMarking: input.negativeMarking,
        passingMarks: input.passingMarks,
        maxAttempts: input.maxAttempts,
        instructions: input.instructions,
        autoSubmit: input.autoSubmit,
        createdBy,
        examSubjects: {
          create: input.subjects.map((s) => ({ subjectId: s.subjectId, questionCount: s.questionCount })),
        },
      },
    });
  }

  publish(id: string) {
    return this.prisma.exam.update({ where: { id }, data: { status: 'published' } });
  }
}
