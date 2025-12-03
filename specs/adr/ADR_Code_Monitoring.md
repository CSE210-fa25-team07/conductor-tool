# Architecture Decision Record (ADR)

**ADR #:** 010
**Title:** Backend Performance Monitoring with RAIL Metrics
**Date:** 2025-12-03
**Status:** Proposed

---

## 1. Context

The Conductor Tool is a web platform for managing large software engineering courses (500+ students) with critical real-time operations including attendance tracking, standup submissions, and team management. As the system scales to support multiple courses and hundreds of concurrent users, we need visibility into backend performance to ensure acceptable response times and identify bottlenecks.

### Problem Statement

- No visibility into API response times or performance degradation
- Unable to identify slow endpoints or bottlenecks proactively
- No data-driven approach to optimize critical user-facing endpoints
- Lack of historical performance data for capacity planning

### Requirements

- **Real-time monitoring**: Track all API endpoint performance
- **RAIL compliance**: Follow Google's RAIL model (Response < 100ms, Load < 5s)
- **Low overhead**: Metrics collection must not impact application performance
- **Persistence**: Historical data must survive server restarts
- **Developer-friendly**: Easy to view metrics without external tools
- **Production-ready**: Must work in development and production environments

### Constraints

- **No external dependencies**: Cannot rely on third-party monitoring services (cost, data privacy)
- **Minimal setup**: Must work out-of-the-box without complex configuration
- **VanillaJS frontend**: No framework dependencies (project design principle)
- **Memory efficient**: In-memory storage must have bounded growth

---

## 2. Decision

We will implement a **custom Express middleware-based metrics collection system** that:

1. **Collects high-precision timing data** for all HTTP requests using `process.hrtime.bigint()`
2. **Stores metrics in-memory** with automatic JSON file persistence
3. **Calculates RAIL performance metrics** (Response < 100ms, Load < 5s) with percentile analysis (P50, P95, P99)
4. **Exposes RESTful API endpoints** for metrics retrieval and analysis
5. **Provides a web dashboard** at `/metrics` for real-time visualization
6. **Implements graceful shutdown** to preserve data on server restart

### Architecture Components

#### Backend

- **`metricsMiddleware.js`**: Express middleware for request/response interception
- **`metricsStorage.js`**: In-memory storage with circular buffer (max 1000 entries)
- **`metricsService.js`**: Statistical calculations (percentiles, RAIL compliance)
- **`metricsApi.js`**: REST API endpoints (`/v1/api/metrics/*`)

#### Frontend

- **`/metrics` page**: Real-time dashboard with system status, RAIL metrics, top endpoints
- **Auto-refresh**: Client-side polling every 30 seconds
- **No build step**: Pure HTML/CSS/VanillaJS

### Key Technical Decisions

1. **High-precision timing**: `process.hrtime.bigint()` for nanosecond accuracy
2. **Non-blocking collection**: Metrics captured after response completion
3. **Circular buffer**: FIFO queue with 1000-entry limit to prevent memory leaks
4. **Dual persistence**: In-memory for speed + JSON file for durability
5. **Auto-save**: Every 5 minutes + graceful shutdown handlers (SIGINT/SIGTERM)
6. **Path exclusions**: Skip static assets (`/js/`, `/css/`), metrics API (prevent feedback loop), and browser automated requests (`/.well-known/`)

---

## 3. Alternatives Considered

### Option 1: Third-party APM (Application Performance Monitoring)

**Tools:** New Relic, Datadog, AppDynamics

**Pros:**

- Enterprise-grade features (distributed tracing, alerting, anomaly detection)
- Battle-tested scalability
- Rich dashboards and integrations

**Cons:**

- **Cost:** Expensive for educational project ($50-500+/month)
- **Data privacy:** Sensitive student/course data sent to external service
- **Complexity:** Overkill for current needs
- **Vendor lock-in:** Difficult to migrate

**Decision:** Rejected due to cost and data privacy concerns

---

### Option 2: Open-source APM (Prometheus + Grafana)

**Tools:** Prometheus for metrics, Grafana for visualization

**Pros:**

- Industry-standard monitoring stack
- Powerful query language (PromQL)
- Beautiful, customizable dashboards
- Free and open-source

**Cons:**

- **Infrastructure overhead:** Requires running additional services (Prometheus server, Grafana server)
- **Complexity:** Steep learning curve for configuration
- **Resource usage:** Memory/CPU overhead for time-series database
- **Setup burden:** Not trivial for team members to replicate locally

**Decision:** Rejected due to operational complexity and resource overhead

---

### Option 3: Logging-based approach (Winston + ELK Stack)

**Tools:** Winston for logging, Elasticsearch/Logstash/Kibana for analysis

**Pros:**

- Unified logging and metrics
- Powerful search and aggregation
- Good for debugging

**Cons:**

- **Heavy infrastructure:** Requires Elasticsearch cluster
- **Performance impact:** Logging every request is I/O intensive
- **Query complexity:** Calculating percentiles in Elasticsearch is non-trivial
- **Overkill:** Designed for distributed systems with millions of logs

**Decision:** Rejected due to infrastructure requirements and complexity

---

### Option 4: Custom lightweight solution (Chosen)

**Implementation:** Express middleware + in-memory storage + JSON persistence

**Pros:**

- **Zero dependencies:** No external services or infrastructure
- **Low overhead:** Minimal CPU/memory footprint (~1-2ms per request)
- **Simple setup:** Works immediately on `npm run dev`
- **Developer-friendly:** Web dashboard accessible at `/metrics`
- **Portable:** Metrics stored as JSON, easy to export/analyze
- **Full control:** Customize for our specific RAIL requirements
- **Educational:** Team learns performance monitoring concepts

**Cons:**

- **Limited scalability:** In-memory storage bounded at 1000 entries
- **Single-server only:** No distributed tracing across microservices
- **Manual alerting:** No built-in anomaly detection or alerts
- **Basic visualization:** Simple HTML/CSS dashboard, not as rich as Grafana

**Decision:** Accepted - pros outweigh cons for current project scale

---

## 4. Consequences

### Positive Outcomes

1. **Performance visibility achieved**

   - Real-time monitoring of all API endpoints
   - Historical data shows performance trends over time
   - P50/P95/P99 percentiles identify outliers

2. **Data-driven optimization**

   - Identified slow endpoints (e.g., `/v1/api/standups` averaging 99.3ms)
   - RAIL compliance tracking (Response: <100ms target, Load: <5s target)
   - Error rate tracking per endpoint

3. **Zero operational overhead**

   - No additional services to deploy or maintain
   - Works identically in development and production
   - Metrics persist through server restarts (graceful shutdown)

4. **Developer experience**

   - Web dashboard at `http://localhost:8081/metrics`
   - JSON API for programmatic access
   - Easy to debug performance issues locally

5. **Cost savings**
   - $0/month vs $50-500/month for commercial APM
   - No vendor lock-in

### Negative Outcomes / Trade-offs

1. **Limited retention**

   - Only 1000 most recent requests stored
   - ~10-60 minutes of data depending on traffic
   - **Mitigation:** Export to CSV/JSON periodically for long-term analysis

2. **No distributed tracing**

   - Cannot trace requests across multiple services
   - **Impact:** Limited, as current architecture is monolithic
   - **Future consideration:** Revisit if migrating to microservices

3. **Manual alerting required**

   - No automatic alerts for performance degradation
   - **Mitigation:** Future enhancement to add threshold-based email alerts

4. **Single point of failure**

   - If server crashes ungracefully, last 5 minutes of metrics may be lost
   - **Mitigation:** Auto-save every 5 minutes reduces risk

5. **Basic dashboard**
   - Simple HTML/CSS interface, not as polished as commercial tools
   - **Impact:** Acceptable for internal development tool

### System Impact

- **Performance overhead:** ~0.5-2ms per request (negligible)
- **Memory usage:** ~500KB - 2MB for 1000 entries
- **Disk usage:** ~500KB JSON file
- **Network impact:** None (all local)

---

## 5. Implementation Notes

### Deployment

The metrics system is deployed automatically with the backend:

```bash
# Development
npm run dev

# Production
node backend/src/server.js
```

### Middleware Integration

Metrics middleware is registered globally in `server.js`:

```javascript
import { metricsCollector } from './metrics/metricsMiddleware.js';

// Must be registered BEFORE routes
app.use(metricsCollector);
```

### Path Exclusions

Specific paths are excluded from tracking to prevent noise and feedback loops:

- `/v1/api/metrics/*` - Prevents metrics API from tracking itself
- `/js/*`, `/css/*`, `/images/*`, `/favicon.ico` - Static assets
- `/metrics` - Dashboard page itself
- `/.well-known/*` - Browser automated requests (Chrome DevTools)

### Data Persistence

1. **Auto-save:** Every 5 minutes via setInterval
2. **Graceful shutdown:** SIGINT (Ctrl+C) and SIGTERM handlers save before exit
3. **File location:** `backend/data/metrics.json`
4. **Format:** JSON with metadata (lastUpdated, totalEntries, maxEntries)

### Configuration

Configurable parameters in `metricsStorage.js`:

```javascript
const DEFAULT_MAX_ENTRIES = 1000; // Retention limit
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const METRICS_FILE_PATH = 'backend/data/metrics.json';
```

### API Endpoints

- `GET /v1/api/metrics/rail` - RAIL metrics summary (response/load compliance)
- `GET /v1/api/metrics/status` - System status (uptime, memory, storage)
- `GET /v1/api/metrics/timeseries` - Time-bucketed data (hourly/daily/weekly)
- `GET /v1/api/metrics/endpoint?path=/api/users` - Single endpoint metrics
- `GET /v1/api/metrics/raw?limit=100` - Raw metrics data
- `DELETE /v1/api/metrics` - Clear all metrics (requires session)

### Dashboard Features

- **System Status:** Total requests, uptime, memory usage, storage capacity
- **RAIL Metrics:** Response/Load compliance with P50/P95/P99 percentiles
- **Status Codes:** Distribution of 2xx/3xx/4xx/5xx responses
- **Top 10 Endpoints:** Highest traffic endpoints with avg response time and error rate
- **Timeseries Chart:** Response time over last 24 hours

### Testing Strategy

1. **Unit tests:** Statistical calculations (percentiles, averages)
2. **Integration tests:** Middleware collection, storage, retrieval
3. **Load tests:** Verify performance overhead under high traffic
4. **Manual testing:** Dashboard functionality, data accuracy

### Monitoring the Monitor

To ensure metrics system health:

```bash
# Check metrics count
curl http://localhost:8081/v1/api/metrics/status

# Verify file persistence
ls -lh backend/data/metrics.json

# Test graceful shutdown
# 1. Start server: node backend/src/server.js
# 2. Generate traffic
# 3. Ctrl+C to shutdown
# 4. Verify metrics.json was updated
```

### Future Enhancements

Potential improvements (not in current scope):

1. **Alerting:** Email/Slack notifications for threshold violations
2. **Anomaly detection:** ML-based detection of performance regression
3. **Longer retention:** Archive old metrics to S3/database
4. **Advanced charts:** Interactive graphs with Chart.js or D3.js
5. **Custom metrics:** Application-specific metrics (e.g., attendance submission latency)
6. **Export:** CSV/Excel export for analysis in Google Sheets
7. **Comparison:** Compare metrics across different time periods

---

## 6. References

### Documentation

- [RAIL Performance Model (Google)](https://web.dev/rail/)
- [Node.js `process.hrtime()` docs](https://nodejs.org/api/process.html#processhrtimebigint)
- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)

### Internal Documentation

- `backend/src/metrics/README.md` - Detailed implementation guide
- `backend/src/metrics/QUICK_REFERENCE.md` - Quick reference for common tasks

### Design Discussions

- Sprint Planning Meeting (2025-11-28): Decision to implement custom metrics
- Code Review (2025-12-02): RAIL metrics implementation approval

### Related Issues

- GitHub Issue #42: "Add performance monitoring to backend"
- GitHub Issue #58: "Fix negative uptime display"
- GitHub Issue #59: "Remove Chrome DevTools requests from metrics"

### Performance Benchmarks

- Middleware overhead: 0.5-2ms per request (measured via wrk)
- Memory footprint: 1.5MB for 1000 entries (measured via `process.memoryUsage()`)
- Auto-save time: ~50ms for 1000 entries (measured via `console.time()`)
