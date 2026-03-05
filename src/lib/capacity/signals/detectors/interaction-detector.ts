/**
 * @file Implements a signal detector for user interaction patterns.
 * Assesses cognitive capacity from click rate and precision using a rolling window.
 *
 * Bug fixes vs. original:
 * - clickCount / totalClickDistance accumulated forever → replaced with a 60-second
 *   rolling window so recent behaviour dominates over historical averages.
 * - IDLE_THRESHOLD_MS was 3 s (too aggressive for focused reading) → raised to 15 s.
 */

import { SignalDetector, SignalReading } from './types';

const DEBOUNCE_MOVE_TIME_MS = 50;
const IDLE_THRESHOLD_MS = 15_000; // 15 s — focused readers pause longer than 3 s
const CLICK_WINDOW_MS = 60_000;   // 60 s rolling window for click history

interface ClickEntry {
  time: number;
  distance: number; // px distance from previous click position
}

export class InteractionDetector implements SignalDetector {
  readonly name = 'InteractionDetector';
  readonly weight = 0.7;

  private lastMouseMoveTime = 0;
  private lastClickTime = 0;
  private lastClickPosition: { x: number; y: number } | null = null;
  private clickHistory: ClickEntry[] = []; // rolling 60-second window
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private isIdle = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
      window.addEventListener('click', this.handleClick, { passive: true });
    }
    this.resetIdleTimer();
  }

  private resetIdleTimer = () => {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.isIdle = false;
    this.idleTimer = setTimeout(() => { this.isIdle = true; }, IDLE_THRESHOLD_MS);
  };

  private handleMouseMove = () => {
    this.lastMouseMoveTime = Date.now();
    this.resetIdleTimer();
  };

  private handleClick = (event: MouseEvent) => {
    this.resetIdleTimer();
    const now = Date.now();
    this.lastClickTime = now;

    let distance = 0;
    if (this.lastClickPosition) {
      const dx = event.clientX - this.lastClickPosition.x;
      const dy = event.clientY - this.lastClickPosition.y;
      distance = Math.sqrt(dx * dx + dy * dy);
    }
    this.lastClickPosition = { x: event.clientX, y: event.clientY };
    this.clickHistory.push({ time: now, distance });
  };

  detect(): SignalReading[] {
    const now = Date.now();

    // Prune entries outside the rolling window
    const cutoff = now - CLICK_WINDOW_MS;
    this.clickHistory = this.clickHistory.filter(c => c.time >= cutoff);

    const clickCount = this.clickHistory.length;
    const avgClickDistance =
      clickCount > 0
        ? this.clickHistory.reduce((sum, c) => sum + c.distance, 0) / clickCount
        : 0;

    const timeSinceLastClick = now - this.lastClickTime;

    let cognitiveValue: number;
    let confidence: number;

    if (this.isIdle) {
      cognitiveValue = 0.4; // Idle: disengaged or deeply thinking
      confidence = 0.6;
    } else if (timeSinceLastClick < 500 && clickCount > 5 && avgClickDistance < 20) {
      cognitiveValue = 0.9; // Highly engaged: frequent, precise clicks
      confidence = 0.9;
    } else if (timeSinceLastClick < 1500 && clickCount > 1 && avgClickDistance < 50) {
      cognitiveValue = 0.7; // Moderately engaged
      confidence = 0.7;
    } else if (avgClickDistance > 100) {
      cognitiveValue = 0.3; // Low precision: possibly frustrated or impaired
      confidence = 0.6;
    } else {
      cognitiveValue = 0.5; // Ambiguous / default
      confidence = 0.5;
    }

    return [{
      dimension: 'cognitive',
      value: cognitiveValue,
      confidence,
      timestamp: now,
      detectorName: this.name,
    }];
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('click', this.handleClick);
    }
    if (this.idleTimer) clearTimeout(this.idleTimer);
  }
}
