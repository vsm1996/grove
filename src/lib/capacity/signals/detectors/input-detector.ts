/**
 * @file Implements a signal detector for user input patterns (typing speed + error rate).
 * Assesses cognitive capacity based on typing behaviour.
 *
 * Bug fix vs. original:
 * - errorCount / lastErrorTime tracked errors since an arbitrary past reset; old
 *   errors counted the same as current ones → replaced with an errorTimes[] sliding
 *   window so only errors within ERROR_CHECK_WINDOW (5 s) are counted.
 * - Inference now uses recentErrorCount (integer) instead of a boolean, letting the
 *   code distinguish a single correction from repeated fumbling.
 */

import { SignalDetector, SignalReading } from './types';

const TYPING_SPEED_SAMPLE_SIZE = 10; // Key presses to average for CPM calculation
const ERROR_CHECK_WINDOW = 5_000;    // ms: only count errors in this sliding window

export class InputDetector implements SignalDetector {
  readonly name = 'InputDetector';
  readonly weight = 0.6;

  private keyPressTimes: number[] = [];
  private errorTimes: number[] = []; // timestamps of recent Backspace/Delete presses

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown, { passive: true });
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    const now = Date.now();

    this.keyPressTimes.push(now);
    if (this.keyPressTimes.length > TYPING_SPEED_SAMPLE_SIZE) {
      this.keyPressTimes.shift();
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.errorTimes.push(now);
    }
  };

  detect(): SignalReading[] {
    const now = Date.now();

    // ── Typing speed (characters per minute) ───────────────────────────────
    let typingSpeedCPM = 0;
    if (this.keyPressTimes.length > 1) {
      const elapsed = this.keyPressTimes[this.keyPressTimes.length - 1] - this.keyPressTimes[0];
      if (elapsed > 0) {
        typingSpeedCPM = (this.keyPressTimes.length / elapsed) * 60_000;
      }
    }

    // ── Recent error count (sliding window) ────────────────────────────────
    const cutoff = now - ERROR_CHECK_WINDOW;
    this.errorTimes = this.errorTimes.filter(t => t >= cutoff);
    const recentErrorCount = this.errorTimes.length;

    // ── Cognitive inference ─────────────────────────────────────────────────
    let cognitiveValue: number;
    let confidence: number;

    if (typingSpeedCPM > 100 && recentErrorCount === 0) {
      cognitiveValue = 0.9; // Fast + accurate → high cognitive capacity
      confidence = 0.8;
    } else if (typingSpeedCPM > 40 && recentErrorCount <= 1) {
      cognitiveValue = 0.7; // Moderate speed, minimal errors
      confidence = 0.7;
    } else if (recentErrorCount > 2 || typingSpeedCPM < 20) {
      cognitiveValue = 0.4; // Repeated errors or very slow → lower capacity
      confidence = 0.6;
    } else {
      cognitiveValue = 0.6; // Ambiguous / default
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
      window.removeEventListener('keydown', this.handleKeyDown);
    }
  }
}
