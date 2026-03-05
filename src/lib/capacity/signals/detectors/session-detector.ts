/**
 * @file Implements a signal detector for session duration.
 * This detector assesses temporal capacity based on how long the user has been active in the current session.
 */

import { SignalDetector, SignalReading } from './types';

/**
 * The SessionDetector class implements the SignalDetector interface
 * to provide signal readings based on the current session duration.
 */
export class SessionDetector implements SignalDetector {
  readonly name = 'SessionDetector';
  readonly weight = 0.7; // Medium-high weight, as session duration can significantly impact capacity
  private sessionStartTime: number;

  constructor() {
    this.sessionStartTime = Date.now();
  }

  /**
   * Detects and returns a SignalReading based on the current session duration.
   * It provides insights into the temporal dimension.
   *
   * @returns {SignalReading} A reading indicating the inferred capacity.
   */
  detect(): SignalReading[] {
    const now = Date.now();
    const sessionDurationMinutes = (now - this.sessionStartTime) / (1000 * 60);

    let temporalValue: number;
    let confidence: number;

    // Temporal capacity inference based on session duration
    if (sessionDurationMinutes < 15) {
      temporalValue = 0.9; // High capacity, just started
      confidence = 0.8;
    } else if (sessionDurationMinutes < 60) {
      temporalValue = 0.7; // Moderate capacity, sustained engagement
      confidence = 0.7;
    } else if (sessionDurationMinutes < 180) {
      temporalValue = 0.5; // Lower capacity, potential fatigue
      confidence = 0.6;
    } else {
      temporalValue = 0.3; // Significantly lower capacity, extended use
      confidence = 0.7;
    }

    return [{
      dimension: 'temporal',
      value: temporalValue,
      confidence: confidence,
      timestamp: now,
      detectorName: this.name,
    }];
  }
}
