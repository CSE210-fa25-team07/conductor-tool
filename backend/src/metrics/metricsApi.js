/**
 * @module metricsApi
 * @description API routes for code monitoring and RAIL metrics
 */

import express from "express";
import * as metricsService from "./metricsService.js";
import { metricsStorage } from "./metricsStorage.js";

const router = express.Router();

/**
 * GET /v1/api/metrics/rail
 * Get RAIL metrics summary
 *
 * Query parameters:
 * - startTime: ISO timestamp (optional)
 * - endTime: ISO timestamp (optional)
 * - path: Filter by specific path (optional)
 *
 * @example
 * GET /v1/api/metrics/rail
 * GET /v1/api/metrics/rail?startTime=2025-12-01T00:00:00Z
 * GET /v1/api/metrics/rail?path=/api/users
 */
router.get("/rail", async (req, res) => {
  try {
    const { startTime, endTime, path } = req.query;

    const options = {};
    if (startTime) options.startTime = new Date(startTime);
    if (endTime) options.endTime = new Date(endTime);
    if (path) options.path = path;

    const metrics = metricsService.getRailMetrics(options);

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /v1/api/metrics/endpoint
 * Get metrics for a specific endpoint
 *
 * Query parameters:
 * - path: Request path (required)
 *
 * @example
 * GET /v1/api/metrics/endpoint?path=/api/users
 */
router.get("/endpoint", async (req, res) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: "Path parameter is required"
      });
    }

    const metrics = metricsService.getEndpointMetrics(path);

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /v1/api/metrics/timeseries
 * Get metrics grouped by time buckets
 *
 * Query parameters:
 * - bucketSize: 'hour', 'day', or 'week' (default: 'hour')
 * - bucketCount: Number of buckets (default: 24)
 *
 * @example
 * GET /v1/api/metrics/timeseries?bucketSize=hour&bucketCount=24
 */
router.get("/timeseries", async (req, res) => {
  try {
    const bucketSize = req.query.bucketSize || "hour";
    const bucketCount = parseInt(req.query.bucketCount) || 24;

    const validBucketSizes = ["hour", "day", "week"];
    if (!validBucketSizes.includes(bucketSize)) {
      return res.status(400).json({
        success: false,
        error: `Invalid bucketSize. Must be one of: ${validBucketSizes.join(", ")}`
      });
    }

    const metrics = metricsService.getMetricsByTimeBucket(bucketSize, bucketCount);

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /v1/api/metrics/status
 * Get monitoring system status
 *
 * @example
 * GET /v1/api/metrics/status
 */
router.get("/status", async (req, res) => {
  try {
    const status = metricsService.getMonitoringStatus();

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /v1/api/metrics/raw
 * Get raw metrics data
 *
 * Query parameters:
 * - limit: Maximum number of entries to return (default: 100)
 * - offset: Number of entries to skip (optional)
 *
 * @example
 * GET /v1/api/metrics/raw?limit=50
 */
router.get("/raw", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const allMetrics = metricsStorage.getAllMetrics();
    const paginatedMetrics = allMetrics.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: {
        total: allMetrics.length,
        offset,
        limit,
        metrics: paginatedMetrics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /v1/api/metrics
 * Clear all stored metrics
 *
 * Note: This endpoint should be protected in production
 *
 * @example
 * DELETE /v1/api/metrics
 */
router.delete("/", async (req, res) => {
  try {
    metricsStorage.clearMetrics();
    await metricsStorage.saveToFile();

    res.status(200).json({
      success: true,
      message: "All metrics cleared"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
