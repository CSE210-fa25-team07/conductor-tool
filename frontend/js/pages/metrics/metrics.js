/**
 * Metrics Dashboard
 * Displays real-time performance metrics and RAIL compliance
 */
import { initGlobalNavigation } from "../../components/navigation.js";

const API_BASE = "/v1/api/metrics";

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  initGlobalNavigation("metrics");
  loadAllMetrics();
  setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  document.getElementById("refresh-btn")?.addEventListener("click", loadAllMetrics);
  document.getElementById("clear-btn")?.addEventListener("click", clearMetrics);
}

/**
 * Load all metrics data
 */
async function loadAllMetrics() {
  try {
    await Promise.all([
      loadSystemStatus(),
      loadRailMetrics(),
      loadTimeseriesData()
    ]);
  } catch (error) {
    showError("Failed to load metrics data");
  }
}

/**
 * Load system status
 */
async function loadSystemStatus() {
  try {
    const response = await fetch(`${API_BASE}/status`);
    const result = await response.json();

    if (result.success && result.data) {
      const data = result.data;
      document.getElementById("total-requests").textContent = (data.metricsCount || 0).toLocaleString();
      document.getElementById("uptime").textContent = data.oldestEntry && data.newestEntry ? formatUptime(Math.floor((new Date(data.newestEntry).getTime() - new Date(data.oldestEntry).getTime()) / 1000)) : "-";
      document.getElementById("memory-usage").textContent = data.memoryUsage ? formatBytes(data.memoryUsage) : "-";
      document.getElementById("storage-size").textContent = data.maxEntries ? `${data.metricsCount}/${data.maxEntries}` : "-";
    }
  } catch (error) {
    // Silent fail - system status will show default values
  }
}

/**
 * Load RAIL metrics
 */
async function loadRailMetrics() {
  try {
    const response = await fetch(`${API_BASE}/rail`);
    const result = await response.json();

    if (result.success) {
      const data = result.data;

      // Update Response metrics
      if (data.rail?.response) {
        const resp = data.rail.response;
        document.getElementById("response-p50").textContent = formatMs(resp.stats?.p50);
        document.getElementById("response-p95").textContent = formatMs(resp.stats?.p95);
        document.getElementById("response-p99").textContent = formatMs(resp.stats?.p99);

        const complianceEl = document.getElementById("response-compliance");
        const compliance = resp.compliance ?? 0;
        complianceEl.textContent = `${compliance.toFixed(1)}%`;
        updateComplianceClass(complianceEl, compliance);
      }

      // Update Load metrics
      if (data.rail?.load) {
        const load = data.rail.load;
        document.getElementById("load-p50").textContent = formatMs(load.stats?.p50);
        document.getElementById("load-p95").textContent = formatMs(load.stats?.p95);
        document.getElementById("load-p99").textContent = formatMs(load.stats?.p99);

        const complianceEl = document.getElementById("load-compliance");
        const compliance = load.compliance ?? 0;
        complianceEl.textContent = `${compliance.toFixed(1)}%`;
        updateComplianceClass(complianceEl, compliance);
      }

      // Update status codes
      if (data.statusCodes) {
        renderStatusCodes(data.statusCodes);
      }

      // Update top endpoints
      if (data.topPaths) {
        renderTopEndpoints(data.topPaths);
      }
    }
  } catch (error) {
    // Silent fail - RAIL metrics will show default values
  }
}

/**
 * Load timeseries data for chart
 */
async function loadTimeseriesData() {
  try {
    const response = await fetch(`${API_BASE}/timeseries?bucketSize=hour&bucketCount=24`);
    const result = await response.json();

    if (result.success) {
      renderTimeseriesChart(result.data);
    }
  } catch (error) {
    // Silent fail - chart will show no data message
  }
}

/**
 * Render status codes distribution
 */
function renderStatusCodes(statusCodes) {
  const container = document.getElementById("status-codes");
  container.innerHTML = "";

  // Group by category
  const grouped = {
    "2xx Success": 0,
    "3xx Redirect": 0,
    "4xx Client Error": 0,
    "5xx Server Error": 0
  };

  Object.entries(statusCodes).forEach(([code, count]) => {
    const firstDigit = code[0];
    if (firstDigit === "2") grouped["2xx Success"] += count;
    else if (firstDigit === "3") grouped["3xx Redirect"] += count;
    else if (firstDigit === "4") grouped["4xx Client Error"] += count;
    else if (firstDigit === "5") grouped["5xx Server Error"] += count;
  });

  Object.entries(grouped).forEach(([label, count]) => {
    if (count > 0) {
      const card = document.createElement("div");
      card.className = "status-code-card";

      if (label.startsWith("2xx")) card.classList.add("success");
      else if (label.startsWith("3xx")) card.classList.add("redirect");
      else card.classList.add("error");

      card.innerHTML = `
        <div class="status-code-label">${label}</div>
        <div class="status-code-value">${count.toLocaleString()}</div>
      `;
      container.appendChild(card);
    }
  });
}

/**
 * Render top endpoints table
 */
function renderTopEndpoints(topPaths) {
  const tbody = document.getElementById("endpoints-tbody");
  tbody.innerHTML = "";

  topPaths.forEach(endpoint => {
    const row = document.createElement("tr");

    // Extract method from path if present, otherwise default to GET
    const method = endpoint.method || "GET";
    const errorRate = endpoint.errorRate || 0;
    const count = endpoint.count || 0;
    const avgTime = endpoint.avgResponseTime ?? 0;

    row.innerHTML = `
      <td><span class="method-badge ${method}">${method}</span></td>
      <td>${endpoint.path || "-"}</td>
      <td>${count.toLocaleString()}</td>
      <td>${formatMs(avgTime)}</td>
      <td>${errorRate.toFixed(1)}%</td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Render timeseries chart (simple text-based for now)
 */
function renderTimeseriesChart(buckets) {
  const container = document.getElementById("timeseries-chart");

  if (!buckets || buckets.length === 0) {
    container.innerHTML = "<div class=\"loading\">No timeseries data available</div>";
    return;
  }

  // Simple text representation
  let chartHTML = "<div style=\"padding: 1rem; font-family: monospace;\">";
  buckets.forEach(bucket => {
    const label = new Date(bucket.start).toLocaleTimeString();
    const avgTime = (bucket.stats?.mean ?? 0).toFixed(1);
    const count = bucket.requestCount ?? 0;
    chartHTML += `<div>${label}: ${avgTime}ms (${count} requests)</div>`;
  });
  chartHTML += "</div>";

  container.innerHTML = chartHTML;
}

/**
 * Clear all metrics
 */
async function clearMetrics() {
  if (!confirm("Are you sure you want to clear all metrics data?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}`, {
      method: "DELETE"
    });
    const result = await response.json();

    if (result.success) {
      alert("Metrics cleared successfully");
      loadAllMetrics();
    } else {
      alert("Failed to clear metrics: " + result.error);
    }
  } catch (error) {
    alert("Error clearing metrics");
  }
}

/**
 * Utility: Format milliseconds
 */
function formatMs(ms) {
  if (ms === null || ms === undefined) return "-";
  return `${ms.toFixed(1)}ms`;
}

/**
 * Utility: Format bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Utility: Format uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Update compliance class based on percentage
 */
function updateComplianceClass(element, compliance) {
  element.classList.remove("warning", "error");
  if (compliance < 50) {
    element.classList.add("error");
  } else if (compliance < 80) {
    element.classList.add("warning");
  }
}

/**
 * Show error message
 */
function showError(message) {
  const container = document.querySelector(".container");
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  container.insertBefore(errorDiv, container.firstChild);

  setTimeout(() => errorDiv.remove(), 5000);
}
