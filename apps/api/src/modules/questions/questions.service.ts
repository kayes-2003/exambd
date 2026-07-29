import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionInput } from '@exambd/shared-types';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  // Admin-facing list — options are included here ONLY because the caller is authenticated
  // as admin/super_admin (enforced by RolesGuard on the controller). Never reuse this method
  // for anything a student-facing endpoint calls.
  async findForAdmin(filters: { subjectId?: string; status?: string; search?: string }) {
    return this.prisma.question.findMany({
      where: {
        subjectId: filters.subjectId,
        status: filters.status,
        questionText: filters.search ? { contains: filters.search, mode: 'insensitive' } : undefined,
      },
      include: { options: true, subject: true, chapter: true, topic: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async create(input: CreateQuestionInput, createdBy: string) {
    return this.prisma.question.create({
      data: {
        questionText: input.questionText,
        questionType: input.questionType,
        subjectId: input.subjectId,
        chapterId: input.chapterId,
        topicId: input.topicId,
        difficulty: input.difficulty,
        marks: input.marks,
        negativeMarks: input.negativeMarks,
        language: input.language,
        explanation: input.explanation,
        reference: input.reference,
        videoUrl: input.videoUrl,
        createdBy,
        options: {
          create: input.options.map((o, i) => ({
            optionText: o.optionText,
            isCorrect: o.isCorrect,
            ordering: i,
          })),
        },
      },
      include: { options: true },
    });
  }

  async publish(id: string, updatedBy: string) {
    const question = await this.prisma.question.findUnique({ where: { id }, include: { options: true } });
    if (!question) throw new NotFoundException('Question not found');
    if (!question.options.some((o) => o.isCorrect)) {
      throw new Error('Cannot publish a question with no correct option marked');
    }
    return this.prisma.question.update({
      where: { id },
      data: { status: 'published', updatedBy },
    });
  }
}
