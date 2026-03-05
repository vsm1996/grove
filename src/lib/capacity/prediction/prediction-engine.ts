/**
 * @file Matches the current context against stored patterns to generate predictive capacity suggestions.
 */

import { CapacityField } from '../types';
import { CapacityPattern, PatternTrigger } from './types';
import { PatternExtractor } from './pattern-extractor';

const PREDICTION_THRESHOLD = 0.5; // Minimum confidence required for a prediction to be returned

/**
 * The PredictionEngine uses extracted patterns to predict future capacity states
 * based on the current context.
 */
export class PredictionEngine {
  private patternExtractor: PatternExtractor;
  private patterns: CapacityPattern[] = [];

  constructor(patternExtractor: PatternExtractor) {
    this.patternExtractor = patternExtractor;
    this.loadPatterns();
  }

  /**
   * Loads or reloads patterns from the extractor.
   */
  loadPatterns(): void {
    this.patterns = this.patternExtractor.extractPatterns();
  }

  /**
   * Generates a predicted CapacityField based on the current context.
   * @param {PatternTrigger} currentContext - The current environmental and behavioral context.
   * @returns {CapacityField | null} A predicted CapacityField or null if no confident prediction can be made.
   */
  predictCapacity(currentContext: PatternTrigger): CapacityField | null {
    let bestMatch: CapacityPattern | null = null;
    let highestConfidence = PREDICTION_THRESHOLD; // Only consider predictions above this threshold

    // Simple matching: find the pattern that most closely matches the current context
    // and has the highest confidence.
    for (const pattern of this.patterns) {
      if (this.matchesContext(pattern.trigger, currentContext)) {
        if (pattern.confidence > highestConfidence) {
          highestConfidence = pattern.confidence;
          bestMatch = pattern;
        }
      }
    }

    if (bestMatch) {
      // Convert Partial<CapacityField> to CapacityField, filling missing values with a default or neutral state
      const predictedField: CapacityField = {
        cognitive: bestMatch.prediction.cognitive ?? 0.5, // Default to 0.5 if not predicted
        temporal: bestMatch.prediction.temporal ?? 0.5,
        emotional: bestMatch.prediction.emotional ?? 0.5,
        valence: bestMatch.prediction.valence ?? 0.0,
      };
      return predictedField;
    }

    return null;
  }

  /**
   * Determines if a pattern's trigger matches the current context.
   * This can be made more sophisticated (e.g., fuzzy matching, weighting different trigger types).
   * @param {PatternTrigger} patternTrigger - The trigger defined in the pattern.
   * @param {PatternTrigger} currentContext - The current environmental and behavioral context.
   * @returns {boolean} True if the pattern trigger matches the current context.
   */
  private matchesContext(patternTrigger: PatternTrigger, currentContext: PatternTrigger): boolean {
    let matches = true;

    if (patternTrigger.timeOfDay !== undefined && currentContext.timeOfDay !== undefined) {
      if (patternTrigger.timeOfDay !== currentContext.timeOfDay) matches = false;
    }
    if (patternTrigger.dayOfWeek !== undefined && currentContext.dayOfWeek !== undefined) {
      if (patternTrigger.dayOfWeek !== currentContext.dayOfWeek) matches = false;
    }
    // TODO: Add matching logic for sessionDuration and other future triggers

    return matches;
  }

  /**
   * Implements confidence decay for patterns. Confidence should decay over time if a pattern is not re-observed.
   * This method would typically be called periodically (e.g., daily) or when patterns are reloaded.
   */
  decayConfidence(): void {
    const currentTime = Date.now();
    this.patterns.forEach(pattern => {
      const timeSinceLastObservation = (currentTime - pattern.timestamp) / (1000 * 60 * 60 * 24); // in days
      const decayFactor = Math.pow(0.9, timeSinceLastObservation); // Exponential decay
      pattern.confidence *= decayFactor;
    });
    // Optionally, patterns below a certain confidence could be removed to save space.
    // This would require persisting patterns back to the PatternStore.
  }
}
