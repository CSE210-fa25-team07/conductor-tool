# Code Monitoring System

This directory contains the code monitoring system for tracking RAIL (Response, Animation, Idle, Load) performance metrics across the Conductor Tool application.

## Overview

The code monitoring system automatically collects API-level performance metrics for every request, stores them in memory with persistence to JSON, and provides detailed analytics via REST API endpoints.

## Architecture

```
┌─────────────────────┐
│  Express Request    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ metricsMiddleware   │  ← Captures start time
│  (start timing)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Route Handler      │  ← Processes request
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ metricsMiddleware   │  ← Captures end time
│  (record metric)    │  ← Calculates response time
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  metricsStorage     │  ← Stores metric
│  (in-memory + file) │  ← Maintains N entries
└─────────────────────┘
```

## Components

### 1. Metrics Middleware (`backend/src/metrics/metricsMiddleware.js`)

Intercepts HTTP requests and responses to measure performance.

**Features:**
- High-precision timing using `process.hrtime.bigint()`
- Non-blocking metric collection
- Built-in path exclusions (static assets, metrics endpoints, navigation paths)
- Automatic metadata capture (method, path, status, user agent)

**Usage:**
```javascript
import { metricsCollector } from './metrics/metricsMiddleware.js';

// In server.js - Collect metrics for all requests globally
app.use(metricsCollector);
```

**Excluded paths (automatically skipped):**
- `/v1/api/metrics/*` - Metrics API endpoints (prevents feedback loop)
- `/js/*`, `/css/*`, `/images/*`, `/favicon.ico` - Static assets
- `/metrics` - Metrics dashboard page
- `/` - Navigation logo link
- `/session`, `/photo`, `/v1/api/auth/session`, `/v1/api/user-context/photo` - When called from `/metrics` page (via referer check)

### 2. Metrics Storage (`backend/src/monitoring/metricsStorage.js`)

In-memory storage with JSON file persistence.

**Features:**
- Time-based retention (default: last 24 hours of data)
- Safety limit (max 10,000 entries to prevent memory overflow)
- Automatic file persistence (auto-save every 5 minutes)
- Graceful shutdown handling (saves on SIGINT/SIGTERM)
- Automatic cleanup on add, save, and load operations
- Time-range and path filtering
- Thread-safe singleton pattern

**Configuration:**
```javascript
// Default: keeps last 24 hours of data
const DEFAULT_RETENTION_HOURS = 24;
const DEFAULT_MAX_ENTRIES = 10000;  // Safety limit

// Auto-saves to: backend/data/metrics.json
```

**Storage Format:**
```json
{
  "lastUpdated": "2025-12-03T12:00:00.000Z",
  "totalEntries": 543,
  "retentionHours": 24,
  "maxEntries": 10000,
  "metrics": [
    {
      "timestamp": "2025-12-03T11:59:59.000Z",
      "method": "GET",
      "path": "/v1/api/users",
      "statusCode": 200,
      "responseTime": 45.2,
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

### 3. Metrics Service (`backend/src/services/metricsService.js`)

Calculates RAIL statistics and analytics.

**Features:**
- RAIL compliance scoring
- Percentile calculations (P50, P75, P95, P99)
- Time-bucket aggregation (hourly, daily, weekly)
- Endpoint-specific analytics
- HTTP status code distribution

**Key Functions:**

#### `getRailMetrics(options)`
Calculate RAIL performance summary.

```javascript
const metrics = getRailMetrics({
  startTime: new Date('2025-12-01T00:00:00Z'),
  endTime: new Date('2025-12-01T23:59:59Z')
});
```

**Returns:**
```javascript
{
  totalRequests: 1000,
  timeRange: { start: "...", end: "..." },
  rail: {
    response: {
      threshold: 100,  // ms
      stats: { mean, median, p50, p75, p95, p99, min, max },
      compliance: 95.2,  // percentage
      compliantRequests: 952
    },
    load: {
      threshold: 5000,  // ms
      stats: { ... },
      compliance: 99.8,
      compliantRequests: 998
    }
  },
  statusCodes: { "200": 950, "404": 30, "500": 20 },
  topPaths: [
    { path: "/v1/api/users", count: 300 },
    { path: "/dashboard", count: 200 }
  ]
}
```

#### `getEndpointMetrics(path)`
Get detailed metrics for a specific endpoint.

```javascript
const metrics = getEndpointMetrics('/v1/api/users');
```

#### `getMetricsByTimeBucket(bucketSize, bucketCount)`
Get time-series data grouped by time buckets.

```javascript
// Last 24 hours, grouped by hour
const hourlyMetrics = getMetricsByTimeBucket('hour', 24);
```

### 4. Metrics API (`backend/src/routes/api/metricsApi.js`)

REST API endpoints for accessing metrics.

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/api/metrics/rail` | Get RAIL metrics summary |
| GET | `/v1/api/metrics/endpoint` | Get endpoint-specific metrics |
| GET | `/v1/api/metrics/timeseries` | Get time-series data |
| GET | `/v1/api/metrics/status` | Get monitoring system status |
| GET | `/v1/api/metrics/raw` | Get raw metrics data |
| DELETE | `/v1/api/metrics` | Clear all metrics |

**Examples:**

```bash
# Get RAIL metrics for last 24 hours
curl "http://localhost:8081/v1/api/metrics/rail?startTime=2025-12-01T00:00:00Z"

# Get metrics for specific endpoint
curl "http://localhost:8081/v1/api/metrics/endpoint?path=/v1/api/users"

# Get hourly time-series for last 24 hours
curl "http://localhost:8081/v1/api/metrics/timeseries?bucketSize=hour&bucketCount=24"

# Check monitoring status
curl "http://localhost:8081/v1/api/metrics/status"

# Clear all metrics (requires authentication)
curl -X DELETE "http://localhost:8081/v1/api/metrics"
```

## RAIL Principles

The system tracks metrics based on Google's RAIL performance model:

### 1. **Response** (< 100ms)
- **What:** Time for user input events to receive feedback
- **Target:** < 100ms
- **Tracked:** API response times for all requests
- **Compliance:** Percentage of requests under 100ms

### 2. **Animation** (60fps = 16ms per frame)
- **What:** Smooth visual transitions
- **Target:** 16ms per frame (60fps)
- **Status:** Frontend-only (not currently tracked in backend)

### 3. **Idle** (Maximize idle time)
- **What:** Main thread availability for user interactions
- **Target:** Maximize
- **Status:** Frontend-only (not currently tracked in backend)

### 4. **Load** (< 5s to interactive)
- **What:** Time until page is fully interactive
- **Target:** < 5000ms (5 seconds)
- **Tracked:** Page load times and API response times
- **Compliance:** Percentage of requests under 5s

**Note:** Currently, the backend tracks **Response** and **Load** metrics at the API level. Frontend-specific Animation and Idle metrics can be added using browser Performance API.

## Frontend Integration

### API Client (`frontend/js/api/metricsApi.js`)

JavaScript client for accessing metrics from the frontend.

```javascript
import { getRailMetrics, getMonitoringStatus } from './api/metricsApi.js';

// Get RAIL metrics
const metrics = await getRailMetrics();

// Get last 24 hours
const todayMetrics = await getRailMetrics({
  startTime: new Date(Date.now() - 24*60*60*1000).toISOString()
});
```

### Display Component (`frontend/js/components/metricsDisplay.js`)

Renders RAIL metrics in the dashboard.

```javascript
import { renderMetrics, setupMetricsAutoRefresh } from './components/metricsDisplay.js';

// Render once
await renderMetrics('#metrics-container');

// Auto-refresh every 30 seconds
const intervalId = setupMetricsAutoRefresh('#metrics-container', 30000);
```

### Styles (`frontend/css/components/metrics.css`)

Pre-styled components with responsive design.

**Include in your HTML:**
```html
<link rel="stylesheet" href="/css/components/metrics.css">
```

## Configuration

### Retention Settings

Edit `backend/src/metrics/metricsStorage.js`:

```javascript
// Keep last 24 hours of data (default)
const DEFAULT_RETENTION_HOURS = 24;

// Safety limit to prevent memory overflow (default)
const DEFAULT_MAX_ENTRIES = 10000;

// Change retention period
// Note: Old metrics are automatically cleaned up based on timestamp
```

### Auto-Save Interval

```javascript
// Auto-save every 5 minutes (default)
metricsStorage.setupAutoSave(5 * 60 * 1000);

// Change to 1 minute
metricsStorage.setupAutoSave(1 * 60 * 1000);
```

### Storage Location

```javascript
// Default: backend/data/metrics.json
const METRICS_FILE_PATH = path.join(__dirname, '../../data/metrics.json');
```

### Path Exclusions

The metrics system automatically excludes specific paths to prevent noise and feedback loops.

**In `backend/src/server.js`:**
```javascript
import { metricsCollector } from './metrics/metricsMiddleware.js';

// Apply globally - collects metrics for all requests
app.use(metricsCollector);
```

**Automatically excluded paths:**
- `/v1/api/metrics/*` - Metrics API endpoints (prevents feedback loop)
- `/js/*`, `/css/*`, `/images/*`, `/favicon.ico` - Static assets
- `/metrics` - Metrics dashboard page
- `/` - Navigation logo link (not meaningful for metrics)
- `/.well-known/*` - Browser automated requests

**Special case - Referer-based exclusions:**
When requests come from the `/metrics` page (detected via referer header):
- `/session`, `/photo`
- `/v1/api/auth/session`, `/v1/api/user-context/photo`

These are excluded only when called from the metrics page to avoid inflating counts during dashboard refreshes.

## Data Persistence

### Automatic Persistence
- **Auto-save:** Every 5 minutes
- **On shutdown:** SIGINT/SIGTERM handlers
- **Location:** `backend/data/metrics.json`

### Manual Persistence

```javascript
import { metricsStorage } from './monitoring/metricsStorage.js';

// Save now
await metricsStorage.saveToFile();

// Load from file
await metricsStorage.loadFromFile();
```

## Performance Impact

The monitoring system is designed to have minimal performance impact:

- **Timing precision:** Nanosecond precision via `process.hrtime.bigint()`
- **Memory overhead:** ~1KB per metric × 1000 entries = ~1MB
- **CPU overhead:** < 1ms per request for metric collection
- **I/O overhead:** Async file writes every 5 minutes (non-blocking)

## Security Considerations

### Authentication

All metrics endpoints are protected by `checkApiSession` middleware. Ensure users are authenticated before viewing metrics.

**To make metrics public** (not recommended for production):
```javascript
// In backend/src/routes/apiRoutes.js
router.use("/metrics", metricsApis);  // Remove checkApiSession
```

### Sensitive Data

Metrics do not store:
- Request body content
- Response data
- Query parameters
- Headers (except User-Agent)
- Session information

Metrics only store:
- Timestamp
- HTTP method
- Request path
- Status code
- Response time
- User agent

## Troubleshooting

### Metrics not being collected

1. **Check middleware is installed:**
   ```javascript
   // In server.js, should appear BEFORE routes
   app.use(metricsCollector);
   ```

2. **Check if path is being excluded:**
   - See "Path Exclusions" section for list of automatically excluded paths
   - Verify your path isn't in the exclusion list

3. **Check metrics count:**
   ```bash
   curl http://localhost:8081/v1/api/metrics/status
   ```

### Metrics file not persisting

1. **Check directory exists:**
   ```bash
   ls -la backend/data/
   ```

2. **Check file permissions:**
   ```bash
   chmod 755 backend/data/
   ```

3. **Check logs for errors:**
   ```javascript
   // In metricsStorage.js, errors are logged to console
   console.error('Error saving metrics to file:', error);
   ```

### High memory usage

1. **Reduce retention period:**
   ```javascript
   // In metricsStorage.js
   const DEFAULT_RETENTION_HOURS = 12;  // Keep only 12 hours
   ```

2. **Clear old metrics manually:**
   ```bash
   curl -X DELETE http://localhost:8081/v1/api/metrics
   ```

3. **Check current memory usage:**
   ```bash
   curl http://localhost:8081/v1/api/metrics/status
   ```

## Future Enhancements

Potential improvements for the monitoring system:

1. **Frontend Performance API Integration**
   - Track Animation metrics (frame timing)
   - Track Idle metrics (main thread idle time)
   - Browser-level Load metrics (FCP, LCP, TTI)

2. **Database Persistence**
   - Store metrics in PostgreSQL instead of JSON
   - Enable historical analysis over weeks/months
   - Add Prisma schema for metrics table

3. **Real-time Dashboards**
   - WebSocket-based live metrics updates
   - Real-time charts with Chart.js or D3.js
   - Alert notifications for threshold violations

4. **Advanced Analytics**
   - Anomaly detection
   - Trend analysis
   - Performance regression detection
   - SLA compliance reporting

5. **Distributed Tracing**
   - Request ID correlation
   - End-to-end transaction tracing
   - Service dependency mapping

## Frontend Dashboard

A web-based metrics dashboard is available for visualizing performance data.

### Access the Dashboard

```
http://localhost:8081/metrics
```

### Features

- **System Status**: Total requests, uptime, memory usage, storage size
- **RAIL Metrics**: Response and Load compliance with P50/P95/P99 percentiles
- **Status Codes**: Distribution of HTTP status codes
- **Top Endpoints**: Most frequently accessed endpoints with performance stats
- **Time Series**: Response time trends over the last 24 hours
- **Actions**: Refresh data and clear metrics

### Files

- **HTML**: `frontend/html/metrics/metrics.html`
- **CSS**: `frontend/css/pages/metrics/metrics.css`
- **JavaScript**: `frontend/js/pages/metrics/metrics.js`

## References

- [Google RAIL Model](https://web.dev/rail/)
- [Web Performance Metrics](https://web.dev/metrics/)
- [Performance Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
