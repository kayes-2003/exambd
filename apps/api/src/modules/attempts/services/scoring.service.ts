import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ScoringService {
  constructor(private prisma: PrismaService) {}

  async scoreAttempt(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    const attemptQuestions = await this.prisma.examAttemptQuestion.findMany({
      where: { attemptId },
      include: { attempt: true },
    });
    const answers = await this.prisma.studentAnswer.findMany({ where: { attemptId } });
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    let score = 0, correct = 0, wrong = 0, skipped = 0;

    for (const aq of attemptQuestions) {
      const question = await this.prisma.question.findUniqueOrThrow({
        where: { id: aq.questionId },
        include: { options: true },
      });
      const answer = answerMap.get(aq.questionId);

      if (!answer?.selectedOptionId) {
        skipped++;
        continue;
      }
      const chosen = question.options.find((o) => o.id === answer.selectedOptionId);
      if (chosen?.isCorrect) {
        correct++;
        score += Number(question.marks);
      } else {
        wrong++;
        score -= Number(question.negativeMarks);
      }
    }

    const { rank, percentile } = await this.computeRankAndPercentile(attempt.examId, attemptId, score);

    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        correctCount: correct,
        wrongCount: wrong,
        skippedCount: skipped,
        rank,
        percentile,
        status: 'submitted',
        submittedAt: new Date(),
      },
    });
  }

  private async computeRankAndPercentile(examId: string, attemptId: string, score: number) {
    const allScores = await this.prisma.examAttempt.findMany({
      where: { examId, status: { in: ['submitted', 'auto_submitted'] } },
      select: { id: true, score: true },
    });
    const scores = allScores.filter((a) => a.id !== attemptId).map((a) => Number(a.score ?? 0));
    scores.push(score);
    scores.sort((a, b) => b - a);

    const rank = scores.indexOf(score) + 1;
    const percentile = ((scores.length - rank) / scores.length) * 100;
    return { rank, percentile: Number(percentile.toFixed(2)) };
  }
}
