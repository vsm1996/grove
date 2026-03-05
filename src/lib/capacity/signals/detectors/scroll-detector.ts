/**
 * @file Implements a signal detector for scroll velocity.
 * This detector assesses cognitive capacity based on the user's scrolling behavior.
 */

import { SignalDetector, SignalReading } from './types';

const DEBOUNCE_TIME_MS = 100; // Milliseconds to debounce scroll events

/**
 * The ScrollDetector class implements the SignalDetector interface
 * to provide signal readings based on scroll velocity.
 */
export class ScrollDetector implements SignalDetector {
  readonly name = 'ScrollDetector';
  readonly weight = 0.5; // Moderate weight, as scroll velocity can indicate engagement or frustration

  private lastScrollY = 0;
  private lastScrollTime = 0;
  private scrollVelocity = 0;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
    }
  }

  /**
   * Handles the scroll event, debouncing it and calculating scroll velocity.
   * @private
   */
  private handleScroll = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      const now = Date.now();
      const scrollY = window.scrollY;

      const distance = Math.abs(scrollY - this.lastScrollY);
      const timeElapsed = now - this.lastScrollTime;

      if (timeElapsed > 0) {
        // Pixels per second
        this.scrollVelocity = (distance / timeElapsed) * 1000;
      } else {
        this.scrollVelocity = 0;
      }

      this.lastScrollY = scrollY;
      this.lastScrollTime = now;
    }, DEBOUNCE_TIME_MS);
  };

  /**
   * Detects and returns a SignalReading based on the current scroll velocity.
   * It provides insights into the cognitive dimension.
   *
   * @returns {SignalReading} A reading indicating the inferred capacity.
   */
  detect(): SignalReading[] {
    const now = Date.now();
    let cognitiveValue: number;
    let confidence: number;

    // Interpret scroll velocity: very fast/slow could indicate issues, moderate is normal
    if (this.scrollVelocity > 1500) {
      cognitiveValue = 0.4; // Very fast scroll, possibly disengaged or frantically searching
      confidence = 0.6;
    } else if (this.scrollVelocity > 500) {
      cognitiveValue = 0.7; // Moderate scroll, engaged browsing
      confidence = 0.8;
    } else if (this.scrollVelocity > 50) {
      cognitiveValue = 0.6; // Slow scroll, careful reading or struggling
      confidence = 0.7;
    } else {
      cognitiveValue = 0.5; // Very slow or no scroll, idle or deeply focused
      confidence = 0.5;
    }

    return [{
      dimension: 'cognitive',
      value: cognitiveValue,
      confidence: confidence,
      timestamp: now,
      detectorName: this.name,
    }];
  }

  /**
   * Cleans up the scroll event listener when the detector is no longer needed.
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll);
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
    }
  }
}
