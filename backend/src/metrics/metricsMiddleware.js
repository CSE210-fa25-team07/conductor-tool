/**
 * @module metrics/middleware
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
  if (path.startsWith("/v1/api/metrics")) {
    return next();
  }

  // Skip static assets (CSS, JS, images, favicon)
  if (path.startsWith("/js/") ||
      path.startsWith("/css/") ||
      path.startsWith("/images/") ||
      path === "/favicon.ico") {
    return next();
  }

  // Skip metrics dashboard page
  if (path === "/metrics") {
    return next();
  }

  // Skip navigation bar logo link (not meaningful for metrics)
  if (path === "/") {
    return next();
  }

  // Skip navigation component API calls ONLY when called from /metrics page
  // Check Referer header to see if request is coming from /metrics
  const referer = req.get("referer") || req.get("referrer") || "";
  const isFromMetricsPage = referer.includes("/metrics");

  // These paths are navigation component calls that happen on every page
  // Only skip them when they're from the metrics page to avoid inflating metrics
  if (isFromMetricsPage) {
    if (path === "/session" ||
        path === "/photo" ||
        path.startsWith("/v1/api/auth/session") ||
        path.startsWith("/v1/api/user-context/photo")) {
      return next();
    }
  }

  // Skip Chrome DevTools and browser automated requests
  if (path.startsWith("/.well-known/")) {
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
