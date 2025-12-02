# Code Monitoring - Quick Reference Card

## Quick Commands

```bash
# Test the monitoring system
node backend/src/metrics/test-metrics.js

# Start server (monitoring auto-enabled)
npm run dev

# View metrics via API
curl http://localhost:8081/v1/api/metrics/rail

# View stored data
cat backend/data/metrics.json

# Clear metrics
curl -X DELETE http://localhost:8081/v1/api/metrics
```

## API Endpoints

Base URL: `http://localhost:8081/v1/api/metrics`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rail` | GET | Get RAIL summary |
| `/endpoint?path=/api/users` | GET | Endpoint metrics |
| `/timeseries?bucketSize=hour&bucketCount=24` | GET | Time-series |
| `/status` | GET | System status |
| `/raw?limit=100` | GET | Raw data |
| `/` | DELETE | Clear all |

## RAIL Thresholds

| Metric | Target | What It Measures |
|--------|--------|------------------|
| **Response** | < 100ms | User input → feedback time |
| **Animation** | 16ms/frame | Smooth 60fps transitions |
| **Idle** | Maximize | Main thread availability |
| **Load** | < 5s | Time to interactive |

Currently tracking: Response, Load (backend API metrics)
Not yet: Animation, Idle (would require frontend implementation)

## File Structure

```
backend/src/metrics/               ← All metrics code (backend only)
├── metricsMiddleware.js           ← Collects metrics
├── metricsStorage.js              ← Stores metrics
├── metricsService.js              ← Calculates stats
├── metricsApi.js                  ← API routes
├── test-metrics.js                ← Test script
├── README.md                      ← Full docs
└── QUICK_REFERENCE.md             ← This file

backend/data/
└── metrics.json                   ← Persistent storage
```

## Configuration Locations

| Setting | File | Line |
|---------|------|------|
| Max entries | `backend/src/metrics/metricsStorage.js` | 14 |
| Auto-save interval | `backend/src/metrics/metricsStorage.js` | 196 |
| Storage path | `metricsStorage.js` | 11 |
| Excluded paths | `server.js` | 30-34 |

## Common Tasks

### Change retention limit (default: 1000)

Edit `backend/src/metrics/metricsStorage.js:14`:
```javascript
const DEFAULT_MAX_ENTRIES = 5000; // Keep 5000 entries
```

### Exclude more paths

Edit `backend/src/server.js:30-34`:
```javascript
app.use(excludeFromMetrics([
  /^\/js\//,
  /^\/css\//,
  /^\/images\//,
  '/health',           // Add this
  /^\/static\//,       // Add this
]));
```

### Add metrics to dashboard

1. Copy this HTML:
```html
<link rel="stylesheet" href="/css/components/metrics.css">
<div id="metrics-container"></div>
<script type="module">
  import { setupMetricsAutoRefresh } from '/js/components/metricsDisplay.js';
  setupMetricsAutoRefresh('#metrics-container', 30000);
</script>
```

2. Paste into your dashboard HTML file

3. Done!

## Sample API Response

```json
{
  "success": true,
  "data": {
    "totalRequests": 100,
    "rail": {
      "response": {
        "threshold": 100,
        "stats": {
          "mean": 84.93,
          "p50": 85.61,
          "p95": 171.18
        },
        "compliance": 64.0,
        "compliantRequests": 64
      }
    },
    "statusCodes": { "200": 84, "404": 5 },
    "topPaths": [
      { "path": "/v1/api/users", "count": 26 }
    ]
  }
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No metrics | Check middleware in `apiRoutes.js` |
| Empty response | Generate traffic first |
| 401 error | Login required (`checkApiSession`) |
| File not saving | Check `backend/data/` permissions |

## Documentation Links

- **Full Docs**: [README.md](README.md)
- **Quick Reference**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (this file)

## Testing Checklist

- [ ] Run test script: `node backend/src/metrics/test-metrics.js`
- [ ] Start server: `npm run dev`
- [ ] Browse app to generate metrics
- [ ] Check API: `curl http://localhost:8081/v1/api/metrics/rail`
- [ ] Verify file: `cat backend/data/metrics.json`

## Pro Tips

1. **Use time filters** for better performance:
   ```bash
   curl "http://localhost:8081/v1/api/metrics/rail?startTime=2025-12-01T00:00:00Z"
   ```

2. **Monitor specific endpoints**:
   ```bash
   curl "http://localhost:8081/v1/api/metrics/endpoint?path=/v1/api/users"
   ```

3. **Clear old data** periodically:
   ```bash
   curl -X DELETE http://localhost:8081/v1/api/metrics
   ```

4. **Watch compliance rates** - aim for:
   - Response: > 90%
   - Load: > 95%

5. **Use time buckets** for trends:
   ```bash
   curl "http://localhost:8081/v1/api/metrics/timeseries?bucketSize=hour&bucketCount=24"
   ```

## Support

1. Check [README.md](README.md) for detailed docs
2. Review API responses for errors
3. Check server logs: `npm run dev` output

---

**Last Updated**: 2025-12-01
**Version**: 1.0.0
**Status**: Production Ready
