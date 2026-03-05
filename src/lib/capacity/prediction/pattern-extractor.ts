/**
 * @file Analyzes session history from PatternStore to identify recurring capacity patterns.
 */

import { CapacityField } from '../types';
import { CapacityPattern, PatternTrigger } from './types';
import { PatternStore } from './pattern-store';

const PATTERN_CONFIDENCE_THRESHOLD = 0.6;   // Minimum confidence to surface a pattern
const PATTERN_MIN_SAMPLE_SIZE = 12;          // Minimum observations before a pattern is surfaced
const PATTERN_FULL_CONFIDENCE_SAMPLE_SIZE = 20; // Sample count at which confidence reaches 1.0
// With these values: 12 samples → confidence 0.6 (just meets threshold), 20 → 1.0

/**
 * Extracts recurring capacity patterns from historical data.
 */
export class PatternExtractor {
  private store: PatternStore;

  constructor(store: PatternStore) {
    this.store = store;
  }

  /**
   * Analyzes the historical capacity data to find recurring patterns.
   * @returns {CapacityPattern[]} An array of identified CapacityPattern objects.
   */
  extractPatterns(): CapacityPattern[] {
    const history = this.store.getHistory();
    if (history.length === 0) {
      return [];
    }

    const patterns: CapacityPattern[] = [];
    const patternMap = new Map<string, CapacityPattern>();

    // Group history items by potential triggers (e.g., time of day, day of week)
    history.forEach(item => {
      const date = new Date(item.timestamp);
      const trigger: PatternTrigger = {
        timeOfDay: date.getHours(),
        dayOfWeek: date.getDay(),
        // TODO: Add session duration once it's captured in history items
      };
      const triggerKey = JSON.stringify(trigger);

      if (!patternMap.has(triggerKey)) {
        patternMap.set(triggerKey, {
          trigger,
          prediction: { ...item.capacity }, // Initialize with first observed capacity
          confidence: 0,
          sampleSize: 0,
          timestamp: item.timestamp,
        });
      }

      const currentPattern = patternMap.get(triggerKey)!;
      // Simple averaging for now, can be replaced with more sophisticated algorithms
      currentPattern.prediction = this.averageCapacityFields(currentPattern.prediction, item.capacity, currentPattern.sampleSize);
      currentPattern.sampleSize++;
      currentPattern.timestamp = Math.max(currentPattern.timestamp, item.timestamp);
    });

    // Calculate confidence and filter patterns
    patternMap.forEach(pattern => {
      // For now, confidence is simply based on sample size relative to MAX_HISTORY_ITEMS
      // This can be improved with statistical methods (e.g., standard deviation of observed values)
      pattern.confidence = Math.min(1, pattern.sampleSize / PATTERN_FULL_CONFIDENCE_SAMPLE_SIZE);

      if (pattern.confidence >= PATTERN_CONFIDENCE_THRESHOLD && pattern.sampleSize >= PATTERN_MIN_SAMPLE_SIZE) {
        patterns.push(pattern);
      }
    });

    return patterns;
  }

  /**
   * Averages two CapacityField objects. Used for incremental averaging of predictions.
   * @param {Partial<CapacityField>} currentAvg - The current averaged capacity field.
   * @param {CapacityField} newItem - The new capacity field to include in the average.
   * @param {number} currentSampleSize - The current number of samples in the average.
   * @returns {Partial<CapacityField>} The new averaged capacity field.
   */
  private averageCapacityFields(
    currentAvg: Partial<CapacityField>,
    newItem: CapacityField,
    currentSampleSize: number
  ): Partial<CapacityField> {
    const newAvg: Partial<CapacityField> = {};
    const oldWeight = currentSampleSize;
    const newWeight = 1;
    const totalWeight = oldWeight + newWeight;

    (Object.keys(newItem) as Array<keyof CapacityField>).forEach(key => {
      if (currentAvg[key] !== undefined) {
        newAvg[key] = ((currentAvg[key]! * oldWeight) + (newItem[key] * newWeight)) / totalWeight;
      } else {
        newAvg[key] = newItem[key];
      }
    });
    return newAvg;
  }
}
