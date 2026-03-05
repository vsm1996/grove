/**
 * @file Implements a signal detector for time-based capacity.
 * Emits two readings per detect() call: cognitive (hour-of-day diurnal pattern)
 * and temporal (weekday vs. weekend).
 */

import { SignalDetector, SignalReading } from './types';

/**
 * The TimeDetector class implements the SignalDetector interface
 * to provide signal readings based on the current time and day.
 */
export class TimeDetector implements SignalDetector {
  readonly name = 'TimeDetector';
  readonly weight = 0.6; // Medium weight — time is significant but a broad generalisation

  /**
   * Detects and returns SignalReadings based on the current time and day.
   * Returns two readings: cognitive (hour-of-day) and temporal (weekday/weekend).
   */
  detect(): SignalReading[] {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const ts = now.getTime();

    // ── Cognitive capacity: typical diurnal patterns ────────────────────────
    let cognitiveValue: number;
    if (hour >= 9 && hour < 12) {
      cognitiveValue = 0.8; // Morning peak
    } else if (hour >= 14 && hour < 17) {
      cognitiveValue = 0.6; // Afternoon dip
    } else if (hour >= 17 && hour < 20) {
      cognitiveValue = 0.5; // Evening, winding down
    } else if (hour >= 20 || hour < 6) {
      cognitiveValue = 0.3; // Late night / early morning
    } else {
      cognitiveValue = 0.7; // Early morning ramp-up (6–9am)
    }

    // ── Temporal capacity: weekday vs. weekend ──────────────────────────────
    const temporalValue = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 0.7 : 0.9;
    // Weekends tend to feel less time-pressured → higher temporal capacity

    return [
      {
        dimension: 'cognitive',
        value: cognitiveValue,
        confidence: 0.7, // Medium — population average, not personalised
        timestamp: ts,
        detectorName: this.name,
      },
      {
        dimension: 'temporal',
        value: temporalValue,
        confidence: 0.6, // Slightly lower — weekday/weekend is a coarser signal
        timestamp: ts,
        detectorName: this.name,
      },
    ];
  }
}
