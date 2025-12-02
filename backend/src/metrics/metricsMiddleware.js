/**
 * @module metricsMiddleware
 * @description Middleware for collecting API-level performance metrics based on RAIL principles
 */

import { metricsStorage } from "./metricsStorage.js";

/**
 * Express middleware that collects performance metrics for each request
 *
 * Tracks:
 * - Response time (RAIL: Response < 100ms)
 * - Request metadata (method, path, status)
 * - Timestamp for analysis
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @example
 * app.use(metricsCollector);
 */
export function metricsCollector(req, res, next) {
  const startTime = process.hrtime.bigint();
  const startDate = new Date();

  // Store original end function
  const originalEnd = res.end;

  // Override res.end to capture metrics when response completes
  res.end = function (...args) {
    // Calculate response time in milliseconds
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds

    // Collect metric data
    const metric = {
      timestamp: startDate.toISOString(),
      method: req.method,
      path: req.path || req.url,
      statusCode: res.statusCode,
      responseTime, // in milliseconds
      userAgent: req.get("user-agent") || "unknown"
    };

    // Store the metric
    metricsStorage.addMetric(metric);

    // Call original end function
    originalEnd.apply(res, args);
  };

  next();
}

/**
 * Middleware to exclude specific paths from metrics collection
 *
 * @param {Array<string|RegExp>} excludePaths - Array of paths or patterns to exclude
 * @returns {Function} Express middleware function
 *
 * @example
 * app.use(excludeFromMetrics(['/health', /^\/static/]));
 */
export function excludeFromMetrics(excludePaths = []) {
  return function (req, res, next) {
    const shouldExclude = excludePaths.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(req.path || req.url);
      }
      return (req.path || req.url) === pattern;
    });

    if (shouldExclude) {
      // Skip metrics collection
      return next();
    }

    // Apply metrics collector
    metricsCollector(req, res, next);
  };
}
