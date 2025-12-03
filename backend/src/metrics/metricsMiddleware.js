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
  // Skip metrics API endpoints, static assets, and metrics dashboard page
  const path = req.path || req.url;

  // Skip metrics API endpoints (prevents feedback loop)
  if (path.startsWith('/v1/api/metrics')) {
    return next();
  }

  // Skip static assets (CSS, JS, images, favicon)
  if (path.startsWith('/js/') ||
      path.startsWith('/css/') ||
      path.startsWith('/images/') ||
      path === '/favicon.ico') {
    return next();
  }

  // Skip metrics dashboard page
  if (path === '/metrics') {
    return next();
  }

  // Skip Chrome DevTools and browser automated requests
  if (path.startsWith('/.well-known/')) {
    return next();
  }

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
 * Middleware to skip metrics collection for specific paths
 * Must be applied BEFORE metricsCollector in the middleware chain
 *
 * Sets req._skipMetrics flag which metricsCollector checks before collecting metrics
 *
 * @param {Array<string|RegExp>} excludePaths - Array of paths or patterns to exclude
 * @returns {Function} Express middleware function
 *
 * @example
 * // In a router, before the global metricsCollector runs:
 * router.use(skipMetricsFor(['/metrics', /^\/health/]));
 */
export function skipMetricsFor(excludePaths = []) {
  return function (req, _res, next) {
    const shouldExclude = excludePaths.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(req.path || req.url);
      }
      return (req.path || req.url) === pattern;
    });

    if (shouldExclude) {
      // Set flag to skip metrics collection
      req._skipMetrics = true;
    }

    next();
  };
}
