import { sweepExpiredAttempts } from './processors/autosubmit.processor';

const SWEEP_INTERVAL_MS = 15_000;

console.log('ExamBD worker started');

setInterval(async () => {
  try {
    const count = await sweepExpiredAttempts();
    if (count > 0) console.log(`[worker] auto-submitted ${count} expired attempt(s)`);
  } catch (err) {
    console.error('[worker] sweep failed', err);
  }
}, SWEEP_INTERVAL_MS);

// Other queues (result notifications, analytics rollups, bulk import processing) register
// their BullMQ processors here as the worker grows — see docs in the architecture doc §17-18.
