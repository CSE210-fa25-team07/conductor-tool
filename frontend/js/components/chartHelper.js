

export const ChartHelper = {
  colors: {
    lecture: "#2196F3",
    "office-hours": "#FF9800",
    "ta-checkin": "#4CAF50",
    "team-meeting": "#9C27B0"
  },

  _makeBarDataset(label, data, color) {
    return {
      label,
      data,
      backgroundColor: color + "aa",
      borderColor: color,
      borderWidth: 2,
      borderRadius: 6
    };
  },

  /**
   * 
   * @param {*} canvasId 
   * @param {*} labels 
   * @param {*} datasetMap 
   * @returns {Chart|null} Bar Chart instance
   */
  createBarChart(canvasId, labels, datasetMap) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");

    const datasets = Object.entries(datasetMap)
      .filter(([_, v]) => v.enabled)
      .map(([k, v]) => this._makeBarDataset(v.label, v.data, this.colors[k]));

    return new Chart(ctx, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: (v) => v + "%" }
          }
        }
      }
    });
  },

  _makeGradient(ctx, color) {
    const g = ctx.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, color);
    g.addColorStop(1, color + "33");
    return g;
  },

  _makeLineDataset(ctx, label, data, color) {
    return {
      label,
      data,
      borderColor: color,
      backgroundColor: this._makeGradient(ctx, color),
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: "#fff",
      pointBorderColor: color,
      spanGaps: true
    };
  },

  /**
   * 
   * @param {*} canvasId 
   * @param {*} labels 
   * @param {*} datasetMap 
   * @returns {Chart|null} Line Chart instance
   */
  createMultiLineChart(canvasId, labels, datasetMap) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");

    const datasets = Object.entries(datasetMap)
      .filter(([_, v]) => v.enabled)
      .map(([k, v]) => this._makeLineDataset(ctx, v.label, v.data, this.colors[k]));

    return new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        spanGaps: true,

        plugins: {
          legend: { position: "top" }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: v => v + "%" }
          }
        }
      }
    });
  }
};
