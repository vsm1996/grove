/**
 * @file Defines the interfaces for predictive adaptation patterns.
 */

import { CapacityField } from '../types';

/**
 * Represents a detected capacity pattern, linking a trigger to a predicted CapacityField.
 */
export interface CapacityPattern {
  trigger: PatternTrigger;
  prediction: Partial<CapacityField>;
  confidence: number;   // 0-1, how confident the system is in this prediction
  sampleSize: number;   // Number of times this pattern has been observed
  timestamp: number;    // When this pattern was last observed/updated
}

/**
 * Defines the conditions that trigger a capacity pattern.
 * This can be extended with more specific properties as needed.
 */
export interface PatternTrigger {
  timeOfDay?: number;    // Hour of the day (0-23)
  dayOfWeek?: number;    // Day of the week (0-6, Sunday-Saturday)
  sessionDuration?: number; // Session duration in minutes
  // Add other relevant contextual triggers here as needed (e.g., location, app usage)
}
