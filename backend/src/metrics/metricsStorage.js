/**
 * @module metricsStorage
 * @description In-memory storage for performance metrics with configurable retention
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
const DEFAULT_MAX_ENTRIES = 1000; // Keep last N entries
const METRICS_FILE_PATH = path.join(__dirname, "../../data/metrics.json");

/**
 * @class MetricsStorage
 * @description Manages storage and retrieval of performance metrics
 */
class MetricsStorage {
  constructor(maxEntries = DEFAULT_MAX_ENTRIES) {
    this.metrics = [];
    this.maxEntries = maxEntries;
    this.loadFromFile();
  }

  /**
   * Add a new metric entry
   *
   * @param {Object} metric - Metric data to store
   * @param {string} metric.timestamp - ISO timestamp
   * @param {string} metric.method - HTTP method
   * @param {string} metric.path - Request path
   * @param {number} metric.statusCode - HTTP status code
   * @param {number} metric.responseTime - Response time in milliseconds
   * @param {string} metric.userAgent - User agent string
   *
   * @example
   * metricsStorage.addMetric({
   *   timestamp: '2025-12-01T12:00:00.000Z',
   *   method: 'GET',
   *   path: '/api/users',
   *   statusCode: 200,
   *   responseTime: 45.2,
   *   userAgent: 'Mozilla/5.0...'
   * });
   */
  addMetric(metric) {
    this.metrics.push(metric);

    // Maintain maximum entries (FIFO)
    if (this.metrics.length > this.maxEntries) {
      this.metrics.shift();
    }
  }

  /**
   * Get all stored metrics
   *
   * @returns {Array<Object>} Array of all metrics
   */
  getAllMetrics() {
    return [...this.metrics];
  }

  /**
   * Get metrics within a time range
   *
   * @param {Date|string} startTime - Start time (inclusive)
   * @param {Date|string} endTime - End time (inclusive)
   * @returns {Array<Object>} Filtered metrics
   *
   * @example
   * const metrics = metricsStorage.getMetricsByTimeRange(
   *   new Date('2025-12-01T00:00:00Z'),
   *   new Date('2025-12-01T23:59:59Z')
   * );
   */
  getMetricsByTimeRange(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    return this.metrics.filter(metric => {
      const timestamp = new Date(metric.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Get metrics for a specific path
   *
   * @param {string} path - Request path to filter by
   * @returns {Array<Object>} Filtered metrics
   */
  getMetricsByPath(path) {
    return this.metrics.filter(metric => metric.path === path);
  }

  /**
   * Get the most recent N metrics
   *
   * @param {number} count - Number of recent metrics to retrieve
   * @returns {Array<Object>} Most recent metrics
   */
  getRecentMetrics(count = 100) {
    return this.metrics.slice(-count);
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Get the total count of stored metrics
   *
   * @returns {number} Number of metrics
   */
  getMetricsCount() {
    return this.metrics.length;
  }

  /**
   * Save metrics to JSON file
   *
   * @returns {Promise<void>}
   */
  async saveToFile() {
    try {
      // Ensure directory exists
      const dir = path.dirname(METRICS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write metrics to file
      const data = JSON.stringify({
        lastUpdated: new Date().toISOString(),
        totalEntries: this.metrics.length,
        maxEntries: this.maxEntries,
        metrics: this.metrics
      }, null, 2);

      await fs.promises.writeFile(METRICS_FILE_PATH, data, "utf8");
    } catch {
      // Silent fail - metrics continue in memory
    }
  }

  /**
   * Load metrics from JSON file
   *
   * @returns {Promise<void>}
   */
  async loadFromFile() {
    try {
      if (fs.existsSync(METRICS_FILE_PATH)) {
        const data = await fs.promises.readFile(METRICS_FILE_PATH, "utf8");
        const parsed = JSON.parse(data);
        this.metrics = parsed.metrics || [];
        this.maxEntries = parsed.maxEntries || DEFAULT_MAX_ENTRIES;
      }
    } catch {
      // File doesn't exist or is invalid - start fresh
      this.metrics = [];
    }
  }

  /**
   * Setup periodic auto-save
   *
   * @param {number} intervalMs - Save interval in milliseconds (default: 5 minutes)
   * @returns {NodeJS.Timeout} Interval ID
   */
  setupAutoSave(intervalMs = 5 * 60 * 1000) {
    return setInterval(() => {
      this.saveToFile();
    }, intervalMs);
  }
}

// Singleton instance
export const metricsStorage = new MetricsStorage();

// Auto-save every 5 minutes
metricsStorage.setupAutoSave();

// Save on process exit
process.on("SIGINT", async () => {
  await metricsStorage.saveToFile();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await metricsStorage.saveToFile();
  process.exit(0);
});
