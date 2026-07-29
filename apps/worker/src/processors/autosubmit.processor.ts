import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Runs every 15s. Finds any exam_attempts still "in_progress" whose deadline
 * (started_at + exam.duration_minutes) has passed, and force-submits them —
 * this is what makes the exam timer server-authoritative: a student cannot
 * extend their time by never calling /submit, closing the tab, or killing JS.
 */
export async function sweepExpiredAttempts() {
  const overdue = await prisma.examAttempt.findMany({
    where: { status: 'in_progress' },
    include: { exam: true },
  });

  const now = Date.now();
  const expired = overdue.filter(
    (a) => a.startedAt.getTime() + a.exam.durationMinutes * 60_000 < now,
  );

  for (const attempt of expired) {
    await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: { status: 'auto_submitted', submittedAt: new Date() },
    });
    // Enqueue scoring — kept as a separate job so a scoring bug never blocks the sweeper itself.
    console.log(`[autosubmit] force-submitted attempt ${attempt.id}, queuing scoring job`);
    // await scoreQueue.add('score-attempt', { attemptId: attempt.id });
  }

  return expired.length;
}
