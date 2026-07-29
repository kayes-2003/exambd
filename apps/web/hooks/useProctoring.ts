"use client";
import { useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { ProctoringEventInput } from '@exambd/shared-types';

// Headless watcher: wires up tab-visibility, blur, fullscreen-exit, copy/paste/right-click
// listeners and reports each as a proctoring_event. This is DETERRENCE + DETECTION, not a
// hard security boundary — see architecture doc §12 for why the real guarantees live server-side.
export function useProctoring(attemptId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const report = (eventType: ProctoringEventInput['eventType'], metadata?: Record<string, unknown>) =>
      apiFetch(`/attempts/${attemptId}/proctoring-event`, {
        method: 'POST',
        body: JSON.stringify({ eventType, metadata }),
      }).catch(() => {});

    const onVisibility = () => document.hidden && report('tab_switch');
    const onBlur = () => report('blur');
    const onFullscreenChange = () => !document.fullscreenElement && report('fullscreen_exit');
    const onCopy = (e: Event) => { e.preventDefault(); report('copy_attempt'); };
    const onPaste = (e: Event) => { e.preventDefault(); report('paste_attempt'); };
    const onContextMenu = (e: Event) => { e.preventDefault(); report('right_click'); };
    const onOffline = () => report('network_disconnect');
    const onOnline = () => report('network_reconnect');

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [attemptId, enabled]);
}
