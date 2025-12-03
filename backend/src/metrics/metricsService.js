/**
 * @module metricsService
 * @description Service for calculating RAIL performance metrics and statistics
 */

import { metricsStorage } from "./metricsStorage.js";

/**
 * Calculate percentile value from sorted array
 *
 * @param {Array<number>} sortedValues - Sorted array of values
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number} Percentile value
 */
function calculatePercentile(sortedValues, percentile) {
  if (sortedValues.length === 0) return 0;

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Calculate basic statistics for an array of numbers
 *
 * @param {Array<number>} values - Array of numeric values
 * @returns {Object} Statistics object
 * @returns {number} returns.mean - Average value
 * @returns {number} returns.median - Median value
 * @returns {number} returns.min - Minimum value
 * @returns {number} returns.max - Maximum value
 * @returns {number} returns.p50 - 50th percentile
 * @returns {number} returns.p75 - 75th percentile
 * @returns {number} returns.p95 - 95th percentile
 * @returns {number} returns.p99 - 99th percentile
 */
function calculateStats(values) {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      p50: 0,
      p75: 0,
      p95: 0,
      p99: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);

  return {
    mean: sum / values.length,
    median: calculatePercentile(sorted, 50),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: calculatePercentile(sorted, 50),
    p75: calculatePercentile(sorted, 75),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99)
  };
}

/**
 * Get RAIL metrics summary for all requests
 *
 * RAIL Principles:
 * - Response: < 100ms for user input events
 * - Animation: 60fps (16ms per frame)
 * - Idle: Maximize idle time
 * - Load: < 5s to interactive (< 5000ms)
 *
 * @param {Object} options - Filter options
 * @param {Date|string} options.startTime - Start time filter
 * @param {Date|string} options.endTime - End time filter
 * @param {string} options.path - Path filter
 * @returns {Object} RAIL metrics summary
 *
 * @example
 * const metrics = getRailMetrics({
 *   startTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
 * });
 */
export function getRailMetrics(options = {}) {
  let metrics;

  // Apply filters
  if (options.startTime || options.endTime) {
    const start = options.startTime || new Date(0);
    const end = options.endTime || new Date();
    metrics = metricsStorage.getMetricsByTimeRange(start, end);
  } else if (options.path) {
    metrics = metricsStorage.getMetricsByPath(options.path);
  } else {
    metrics = metricsStorage.getAllMetrics();
  }

  if (metrics.length === 0) {
    return {
      totalRequests: 0,
      timeRange: {
        start: null,
        end: null
      },
      rail: {
        response: {
          threshold: 100, // ms
          stats: calculateStats([]),
          compliance: 0
        },
        load: {
          threshold: 5000, // ms
          stats: calculateStats([]),
          compliance: 0
        }
      },
      statusCodes: {},
      topPaths: []
    };
  }

  // Extract response times
  const responseTimes = metrics.map(m => m.responseTime);

  // Calculate RAIL: Response (< 100ms)
  const responseCompliant = metrics.filter(m => m.responseTime < 100).length;
  const responseComplianceRate = (responseCompliant / metrics.length) * 100;

  // Calculate RAIL: Load (< 5000ms for page loads)
  const loadCompliant = metrics.filter(m => m.responseTime < 5000).length;
  const loadComplianceRate = (loadCompliant / metrics.length) * 100;

  // Status code distribution
  const statusCodes = {};
  metrics.forEach(m => {
    statusCodes[m.statusCode] = (statusCodes[m.statusCode] || 0) + 1;
  });

  // Top paths by request count with avg response time and error rate
  const pathStats = {};
  metrics.forEach(m => {
    if (!pathStats[m.path]) {
      pathStats[m.path] = {
        count: 0,
        totalResponseTime: 0,
        errors: 0
      };
    }
    pathStats[m.path].count++;
    pathStats[m.path].totalResponseTime += m.responseTime;
    if (m.statusCode >= 400) {
      pathStats[m.path].errors++;
    }
  });

  const topPaths = Object.entries(pathStats)
    .map(([path, stats]) => ({
      path,
      count: stats.count,
      avgResponseTime: stats.totalResponseTime / stats.count,
      errorRate: (stats.errors / stats.count) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate stats
  const stats = calculateStats(responseTimes);

  return {
    totalRequests: metrics.length,
    timeRange: {
      start: metrics[0]?.timestamp,
      end: metrics[metrics.length - 1]?.timestamp
    },
    rail: {
      response: {
        threshold: 100, // ms
        stats,
        compliance: responseComplianceRate,
        compliantRequests: responseCompliant
      },
      load: {
        threshold: 5000, // ms
        stats,
        compliance: loadComplianceRate,
        compliantRequests: loadCompliant
      }
    },
    statusCodes,
    topPaths
  };
}

/**
 * Get detailed metrics for a specific endpoint
 *
 * @param {string} path - Request path
 * @returns {Object} Endpoint-specific metrics
 */
export function getEndpointMetrics(path) {
  const metrics = metricsStorage.getMetricsByPath(path);
  const responseTimes = metrics.map(m => m.responseTime);

  return {
    path,
    totalRequests: metrics.length,
    stats: calculateStats(responseTimes),
    recentRequests: metrics.slice(-10).map(m => ({
      timestamp: m.timestamp,
      responseTime: m.responseTime,
      statusCode: m.statusCode
    }))
  };
}

/**
 * Get metrics summary grouped by time buckets
 *
 * @param {string} bucketSize - Time bucket size ('hour', 'day', 'week')
 * @param {number} bucketCount - Number of buckets to return
 * @returns {Array<Object>} Array of metrics per time bucket
 *
 * @example
 * const hourlyMetrics = getMetricsByTimeBucket('hour', 24);
 */
export function getMetricsByTimeBucket(bucketSize = "hour", bucketCount = 24) {
  const metrics = metricsStorage.getAllMetrics();

  const bucketSizeMs = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000
  }[bucketSize] || 60 * 60 * 1000;

  const now = Date.now();
  const buckets = [];

  // Create buckets
  for (let i = bucketCount - 1; i >= 0; i--) {
    const bucketEnd = now - (i * bucketSizeMs);
    const bucketStart = bucketEnd - bucketSizeMs;

    const bucketMetrics = metrics.filter(m => {
      const timestamp = new Date(m.timestamp).getTime();
      return timestamp >= bucketStart && timestamp < bucketEnd;
    });

    const responseTimes = bucketMetrics.map(m => m.responseTime);

    buckets.push({
      start: new Date(bucketStart).toISOString(),
      end: new Date(bucketEnd).toISOString(),
      requestCount: bucketMetrics.length,
      stats: calculateStats(responseTimes)
    });
  }

  return buckets;
}

/**
 * Get current monitoring status
 *
 * @returns {Object} Monitoring status
 */
export function getMonitoringStatus() {
  const memUsage = process.memoryUsage();
  const allMetrics = metricsStorage.getAllMetrics();

  // Find actual oldest and newest timestamps (array may not be sorted)
  let oldestTimestamp = null;
  let newestTimestamp = null;

  if (allMetrics.length > 0) {
    const timestamps = allMetrics.map(m => new Date(m.timestamp).getTime());
    oldestTimestamp = new Date(Math.min(...timestamps)).toISOString();
    newestTimestamp = new Date(Math.max(...timestamps)).toISOString();
  }

  return {
    isActive: true,
    metricsCount: metricsStorage.getMetricsCount(),
    maxEntries: metricsStorage.maxEntries,
    oldestEntry: oldestTimestamp,
    newestEntry: newestTimestamp,
    memoryUsage: memUsage.heapUsed // Heap memory used in bytes
  };
}
