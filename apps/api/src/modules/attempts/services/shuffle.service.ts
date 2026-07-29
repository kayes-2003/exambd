import { Injectable } from '@nestjs/common';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

// Deterministic seeded PRNG (mulberry32) so a page refresh mid-exam can rebuild the exact
// same shuffle from the stored seed, without persisting the whole shuffled order client-side.
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function fisherYates<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

@Injectable()
export class ShuffleService {
  shuffleQuestions<T>(pool: T[], count: number, rng: () => number): T[] {
    return fisherYates(pool, rng).slice(0, count);
  }

  // Returns the label -> option_id assignments for one question. Correctness travels with
  // option.id, never with the label, so a fixed "Correct = A" is structurally impossible here.
  shuffleOptions(
    options: { id: string; isCorrect: boolean }[],
    rng: () => number,
  ): { optionId: string; displayLabel: string }[] {
    const shuffled = fisherYates(options, rng);
    return shuffled.map((opt, i) => ({ optionId: opt.id, displayLabel: LABELS[i] }));
  }
}
