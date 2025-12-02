/**
 * @file test-metrics.js
 * @description Simple test script to verify the metrics monitoring system
 *
 * Usage:
 *   node backend/src/metrics/test-metrics.js
 *
 * This script:
 * 1. Tests the metricsStorage module
 * 2. Tests the metricsService module
 * 3. Simulates metric collection
 * 4. Displays sample results
 */

import { metricsStorage } from './metricsStorage.js';
import * as metricsService from './metricsService.js';

console.log('='.repeat(60));
console.log('Code Monitoring System - Test Script');
console.log('='.repeat(60));

// Clear existing metrics for clean test
console.log('\n1. Clearing existing metrics...');
metricsStorage.clearMetrics();
console.log('   ✓ Metrics cleared');

// Simulate adding metrics
console.log('\n2. Simulating metric collection...');

const paths = [
  '/v1/api/users',
  '/v1/api/courses',
  '/v1/api/attendance',
  '/dashboard',
  '/v1/api/standups',
];

const methods = ['GET', 'POST', 'PUT', 'DELETE'];
const statusCodes = [200, 201, 400, 404, 500];

// Generate 100 sample metrics
for (let i = 0; i < 100; i++) {
  const responseTime = Math.random() * 200; // 0-200ms
  const path = paths[Math.floor(Math.random() * paths.length)];
  const method = methods[Math.floor(Math.random() * methods.length)];
  const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];

  // Bias towards 200 status codes
  const finalStatusCode = Math.random() < 0.8 ? 200 : statusCode;

  metricsStorage.addMetric({
    timestamp: new Date(Date.now() - (100 - i) * 60000).toISOString(), // Spread over 100 minutes
    method,
    path,
    statusCode: finalStatusCode,
    responseTime,
    userAgent: 'Mozilla/5.0 (Test Agent)',
  });
}

console.log(`   ✓ Generated ${metricsStorage.getMetricsCount()} sample metrics`);

// Test metricsService
console.log('\n3. Calculating RAIL metrics...');

const railMetrics = metricsService.getRailMetrics();

console.log('   ✓ RAIL metrics calculated');

// Display results
console.log('\n' + '='.repeat(60));
console.log('RESULTS');
console.log('='.repeat(60));

console.log(`\nTotal Requests: ${railMetrics.totalRequests}`);

console.log('\n--- Response Time (RAIL: < 100ms) ---');
console.log(`  Compliance: ${railMetrics.rail.response.compliance.toFixed(1)}%`);
console.log(`  Compliant Requests: ${railMetrics.rail.response.compliantRequests}/${railMetrics.totalRequests}`);
console.log(`  Average: ${railMetrics.rail.response.stats.mean.toFixed(2)}ms`);
console.log(`  Median (P50): ${railMetrics.rail.response.stats.p50.toFixed(2)}ms`);
console.log(`  P95: ${railMetrics.rail.response.stats.p95.toFixed(2)}ms`);
console.log(`  Min: ${railMetrics.rail.response.stats.min.toFixed(2)}ms`);
console.log(`  Max: ${railMetrics.rail.response.stats.max.toFixed(2)}ms`);

console.log('\n--- Load Time (RAIL: < 5000ms) ---');
console.log(`  Compliance: ${railMetrics.rail.load.compliance.toFixed(1)}%`);
console.log(`  Compliant Requests: ${railMetrics.rail.load.compliantRequests}/${railMetrics.totalRequests}`);

console.log('\n--- HTTP Status Codes ---');
Object.entries(railMetrics.statusCodes)
  .sort((a, b) => b[1] - a[1])
  .forEach(([code, count]) => {
    const percentage = ((count / railMetrics.totalRequests) * 100).toFixed(1);
    console.log(`  ${code}: ${count} (${percentage}%)`);
  });

console.log('\n--- Top 5 Endpoints ---');
railMetrics.topPaths.slice(0, 5).forEach(({ path, count }) => {
  const percentage = ((count / railMetrics.totalRequests) * 100).toFixed(1);
  console.log(`  ${path}: ${count} (${percentage}%)`);
});

// Test time-series
console.log('\n4. Testing time-series aggregation...');
const timeSeries = metricsService.getMetricsByTimeBucket('hour', 3);
console.log(`   ✓ Generated ${timeSeries.length} time buckets`);

console.log('\n--- Hourly Metrics (Last 3 Hours) ---');
timeSeries.forEach((bucket, index) => {
  const startTime = new Date(bucket.start).toLocaleTimeString();
  console.log(`  Hour ${index + 1} (${startTime}): ${bucket.requestCount} requests, avg ${bucket.stats.mean.toFixed(2)}ms`);
});

// Test endpoint-specific metrics
console.log('\n5. Testing endpoint-specific metrics...');
const endpointMetrics = metricsService.getEndpointMetrics('/v1/api/users');
console.log(`   ✓ Retrieved metrics for /v1/api/users`);
console.log(`   Total Requests: ${endpointMetrics.totalRequests}`);
console.log(`   Average Response: ${endpointMetrics.stats.mean.toFixed(2)}ms`);

// Test monitoring status
console.log('\n6. Checking monitoring status...');
const status = metricsService.getMonitoringStatus();
console.log('   ✓ Monitoring system status:');
console.log(`   Active: ${status.isActive}`);
console.log(`   Metrics Count: ${status.metricsCount}`);
console.log(`   Max Entries: ${status.maxEntries}`);

// Test file persistence
console.log('\n7. Testing file persistence...');
await metricsStorage.saveToFile();
console.log('   ✓ Metrics saved to file: backend/data/metrics.json');

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE');
console.log('='.repeat(60));
console.log('\nNext steps:');
console.log('  1. Start the server: npm run dev');
console.log('  2. Make some real requests');
console.log('  3. View metrics: curl http://localhost:8081/v1/api/metrics/rail');
console.log('  4. Check stored data: cat backend/data/metrics.json');
console.log('  5. Integrate display component into your dashboard');
console.log('');

// Don't exit immediately to allow async operations to complete
setTimeout(() => {
  process.exit(0);
}, 1000);
