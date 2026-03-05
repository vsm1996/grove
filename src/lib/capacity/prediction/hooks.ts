/**
 * @file React hook for exposing predicted capacity states.
 */

import { useState, useEffect, useRef } from 'react';
import { CapacityField } from '../types';
import { PatternStore } from './pattern-store';
import { PatternExtractor } from './pattern-extractor';
import { PredictionEngine } from './prediction-engine';
import { PatternTrigger } from './types';

const PREDICTION_INTERVAL_MS = 5000; // Check for new predictions every 5 seconds

/**
 * A React hook that provides the anticipated future capacity state.
 * It initializes and uses the PatternStore, PatternExtractor, and PredictionEngine.
 * @returns {CapacityField | null} The predicted CapacityField or null if no confident prediction is available.
 */
export function usePredictedCapacity(): CapacityField | null {
  const [predictedCapacity, setPredictedCapacity] = useState<CapacityField | null>(null);

  // Use useRef to keep instances stable across re-renders
  const patternStoreRef = useRef<PatternStore | null>(null);
  const patternExtractorRef = useRef<PatternExtractor | null>(null);
  const predictionEngineRef = useRef<PredictionEngine | null>(null);

  // Initialize on first render
  useEffect(() => {
    patternStoreRef.current = new PatternStore();
    patternExtractorRef.current = new PatternExtractor(patternStoreRef.current);
    predictionEngineRef.current = new PredictionEngine(patternExtractorRef.current);

    // Initial pattern loading
    predictionEngineRef.current.loadPatterns();

    const intervalId = setInterval(() => {
      try {
        predictionEngineRef.current?.loadPatterns();
        predictionEngineRef.current?.decayConfidence();

        // Get current context (e.g., time of day, day of week)
        const now = new Date();
        const currentContext: PatternTrigger = {
          timeOfDay: now.getHours(),
          dayOfWeek: now.getDay(),
          // TODO: Add sessionDuration to currentContext
        };

        const prediction = predictionEngineRef.current?.predictCapacity(currentContext);
        setPredictedCapacity(prediction ?? null);
      } catch (error) {
        console.warn('[usePredictedCapacity] Prediction cycle failed:', error);
      }
    }, PREDICTION_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  return predictedCapacity;
}
