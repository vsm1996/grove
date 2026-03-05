/**
 * @file Aggregates signals from all detectors into a suggested CapacityField.
 *
 * Bug fixes vs. original:
 * - detect() now returns SignalReading[] so readings.push(...) spreads the array.
 * - getDetectorWeight() now uses a per-detector/dimension lookup table instead of
 *   ignoring the dimension parameter.
 * - destroy() uses the optional-chaining destroy?() instead of (detector as any).destroy().
 */

import { SignalDetector, SignalReading } from './detectors/types';
import { CapacityField } from '../types';
import { TimeDetector } from './detectors/time-detector';
import { SessionDetector } from './detectors/session-detector';
import { ScrollDetector } from './detectors/scroll-detector';
import { InteractionDetector } from './detectors/interaction-detector';
import { InputDetector } from './detectors/input-detector';
import { EnvironmentDetector } from './detectors/environment-detector';

export class SignalAggregator {
  private detectors: SignalDetector[];

  /**
   * Per-detector, per-dimension weight overrides.
   * Falls back to detector.weight for any unlisted combination.
   *
   * Rationale for asymmetries:
   * - TimeDetector: cognitive signal is stronger (diurnal pattern) than temporal
   *   (weekday/weekend is coarser)
   * - EnvironmentDetector: emotional signal (color scheme) is a stronger explicit
   *   preference than temporal (reduced-motion)
   */
  private static readonly DIMENSION_WEIGHTS: Partial<
    Record<string, Partial<Record<SignalReading['dimension'], number>>>
  > = {
    TimeDetector:        { cognitive: 0.6, temporal: 0.5 },
    EnvironmentDetector: { emotional: 0.8, temporal: 0.7 },
    InteractionDetector: { cognitive: 0.7 },
    InputDetector:       { cognitive: 0.6 },
    SessionDetector:     { temporal: 0.7 },
    ScrollDetector:      { cognitive: 0.5 },
  };

  constructor() {
    this.detectors = [
      new TimeDetector(),
      new SessionDetector(),
      new ScrollDetector(),
      new InteractionDetector(),
      new InputDetector(),
      new EnvironmentDetector(),
    ];
  }

  /**
   * Collects signal readings from all detectors and aggregates them into a
   * confidence-weighted CapacityField.
   */
  async aggregateSignals(): Promise<CapacityField> {
    const readings: SignalReading[] = [];

    for (const detector of this.detectors) {
      const detectorReadings = await detector.detect();
      readings.push(...detectorReadings);
    }

    const weightedSums: Record<SignalReading['dimension'], number> = {
      cognitive: 0, temporal: 0, emotional: 0, valence: 0,
    };
    const totalWeights: Record<SignalReading['dimension'], number> = {
      cognitive: 0, temporal: 0, emotional: 0, valence: 0,
    };

    for (const reading of readings) {
      const effectiveWeight =
        reading.confidence * this.getDetectorWeight(reading.dimension, reading.detectorName);
      weightedSums[reading.dimension] += reading.value * effectiveWeight;
      totalWeights[reading.dimension] += effectiveWeight;
    }

    return {
      cognitive: totalWeights.cognitive > 0 ? weightedSums.cognitive / totalWeights.cognitive : 0.5,
      temporal:  totalWeights.temporal  > 0 ? weightedSums.temporal  / totalWeights.temporal  : 0.5,
      emotional: totalWeights.emotional > 0 ? weightedSums.emotional / totalWeights.emotional : 0.5,
      valence:   totalWeights.valence   > 0 ? weightedSums.valence   / totalWeights.valence   : 0,
    };
  }

  /**
   * Returns the effective weight for a detector/dimension pair.
   * Checks DIMENSION_WEIGHTS first; falls back to detector.weight.
   */
  private getDetectorWeight(
    dimension: SignalReading['dimension'],
    detectorName: string,
  ): number {
    const override = SignalAggregator.DIMENSION_WEIGHTS[detectorName]?.[dimension];
    if (override !== undefined) return override;
    return this.detectors.find(d => d.name === detectorName)?.weight ?? 0;
  }

  /** Cleans up all detector resources (event listeners, timers). */
  destroy() {
    for (const detector of this.detectors) {
      detector.destroy?.();
    }
  }
}
