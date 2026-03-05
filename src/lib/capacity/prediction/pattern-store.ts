/**
 * @file Manages the storage and retrieval of CapacityField patterns in localStorage.
 * Provides CRUD operations for persisting user capacity history.
 *
 * Bug fix vs. original: all localStorage calls are now wrapped in try/catch.
 * localStorage.setItem() throws DOMException when the storage quota is exceeded and
 * JSON.parse throws SyntaxError on corrupt data. Both are now handled gracefully —
 * reads degrade to [] and writes are silently skipped.
 */

import { CapacityField } from '../types';

const LOCAL_STORAGE_KEY = 'harmonia-capacity-history';
const MAX_HISTORY_ITEMS = 100;

interface CapacityHistoryItem {
  timestamp: number;
  capacity: CapacityField;
}

export class PatternStore {

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      }
    } catch {
      // localStorage unavailable or quota exceeded — operate in-memory only
    }
  }

  /**
   * Records a new CapacityField state with a timestamp.
   * Silently skips the write if localStorage is full or unavailable.
   */
  recordCapacity(capacity: CapacityField): void {
    if (typeof window === 'undefined') return;
    try {
      const history = this.getHistory();
      history.push({ timestamp: Date.now(), capacity });
      if (history.length > MAX_HISTORY_ITEMS) history.shift();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Quota exceeded or storage unavailable — skip this record
    }
  }

  /**
   * Retrieves the entire capacity history.
   * Returns [] on any storage or parse error.
   */
  getHistory(): CapacityHistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Clears the entire capacity history. */
  clearHistory(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Silently ignore — not critical
    }
  }

  /** Deletes a specific historical item by its timestamp. */
  deleteItem(timestamp: number): void {
    if (typeof window === 'undefined') return;
    try {
      const history = this.getHistory().filter(item => item.timestamp !== timestamp);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Silently ignore
    }
  }

  /** Updates the capacity fields of a specific historical item. */
  updateItem(timestamp: number, updates: Partial<CapacityField>): void {
    if (typeof window === 'undefined') return;
    try {
      const history = this.getHistory();
      const idx = history.findIndex(item => item.timestamp === timestamp);
      if (idx !== -1) {
        history[idx].capacity = { ...history[idx].capacity, ...updates };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
      }
    } catch {
      // Silently ignore
    }
  }
}
