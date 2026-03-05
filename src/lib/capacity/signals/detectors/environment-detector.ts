/**
 * @file Implements signal detectors for environmental preferences.
 * Reads prefers-reduced-motion (→ temporal) and prefers-color-scheme (→ emotional).
 *
 * Bug fixes vs. original:
 * - Memory leak: stored MediaQueryList refs so removeEventListener unregisters the
 *   exact same handler that was registered (arrow-function class properties create a
 *   new reference on each access, so calling this.detect would never unregister).
 * - Discarded temporal dimension: now returns both temporal and emotional readings.
 */

import { SignalDetector, SignalReading } from './types';

export class EnvironmentDetector implements SignalDetector {
  readonly name = 'EnvironmentDetector';
  readonly weight = 0.8; // High weight — these are explicit user preferences

  private mqlReducedMotion: MediaQueryList | null = null;
  private mqlDarkMode: MediaQueryList | null = null;
  // A single stable handler reference that both addEventListener and
  // removeEventListener receive. detect() is stateless so the handler is a
  // no-op: the aggregator polls detect() on its own 2-second schedule.
  private readonly handleChange: () => void;

  constructor() {
    this.handleChange = () => {};
    if (typeof window !== 'undefined') {
      this.mqlReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.mqlDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
      this.mqlReducedMotion.addEventListener('change', this.handleChange);
      this.mqlDarkMode.addEventListener('change', this.handleChange);
    }
  }

  /**
   * Returns two readings:
   * - temporal:  based on prefers-reduced-motion (low → less time pressure on animations)
   * - emotional: based on prefers-color-scheme   (dark → slightly lower emotional load)
   */
  detect(): SignalReading[] {
    const now = Date.now();

    // Use stored refs for efficiency; fall back to fresh queries on SSR or if
    // the constructor ran without a window (e.g. jest with no matchMedia stub).
    const prefersReducedMotion =
      this.mqlReducedMotion != null
        ? this.mqlReducedMotion.matches
        : typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const prefersDarkMode =
      this.mqlDarkMode != null
        ? this.mqlDarkMode.matches
        : typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;

    return [
      {
        dimension: 'temporal',
        // prefers-reduced-motion → user may have lower tolerance for demanding UIs
        value: prefersReducedMotion ? 0.3 : 0.8,
        confidence: 0.9,
        timestamp: now,
        detectorName: this.name,
      },
      {
        dimension: 'emotional',
        // Dark mode preference → slightly lower emotional capacity or reduced-stimulation preference
        value: prefersDarkMode ? 0.6 : 0.7,
        confidence: 0.9,
        timestamp: now,
        detectorName: this.name,
      },
    ];
  }

  /**
   * Removes the event listeners registered in the constructor.
   * Uses the stored refs so the same function reference is unregistered.
   */
  destroy() {
    this.mqlReducedMotion?.removeEventListener('change', this.handleChange);
    this.mqlDarkMode?.removeEventListener('change', this.handleChange);
    this.mqlReducedMotion = null;
    this.mqlDarkMode = null;
  }
}
