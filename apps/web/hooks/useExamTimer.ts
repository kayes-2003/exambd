"use client";
import { useEffect, useState } from 'react';

// Renders a countdown from a SERVER-provided endAt/remainingSeconds — never computes
// duration purely client-side, so a manipulated system clock can't extend exam time.
// Reconciles against the server value passed in on every autosave response.
export function useExamTimer(remainingSecondsFromServer: number, onExpire: () => void) {
  const [seconds, setSeconds] = useState(remainingSecondsFromServer);

  useEffect(() => setSeconds(remainingSecondsFromServer), [remainingSecondsFromServer]);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire();
      return;
    }
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds, onExpire]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return { seconds, formatted: `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` };
}
