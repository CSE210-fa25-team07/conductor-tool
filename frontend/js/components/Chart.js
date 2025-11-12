// =============================================
// Chart.js Helper Module
// Reusable chart configurations and utilities
// =============================================

const ChartHelper = {
  // Default chart colors
  colors: {
    primary: '#4CAF50',
    secondary: '#2196F3',
    warning: '#ff9800',
    danger: '#f44336',
    info: '#00bcd4',
    purple: '#9c27b0',
    gradient: {
      green: ['rgba(76, 175, 80, 0.8)', 'rgba(76, 175, 80, 0.2)'],
      blue: ['rgba(33, 150, 243, 0.8)', 'rgba(33, 150, 243, 0.2)'],
      orange: ['rgba(255, 152, 0, 0.8)', 'rgba(255, 152, 0, 0.2)'],
      red: ['rgba(244, 67, 54, 0.8)', 'rgba(244, 67, 54, 0.2)']
    }
  },

  // Create gradient for line charts
  createGradient(ctx, colors) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    return gradient;
  },

  // Default configuration for line charts
  lineChartConfig(data, options = {}) {
    return {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: options.showLegend !== false,
            position: 'top',
            labels: {
              padding: 15,
              font: {
                size: 12,
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += Math.round(context.parsed.y * 10) / 10 + '%';
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              },
              font: {
                size: 11
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        ...options
      }
    };
  },

  // Default configuration for bar charts
  barChartConfig(data, options = {}) {
    return {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function(context) {
                return 'Attendance: ' + Math.round(context.parsed.y * 10) / 10 + '%';
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12,
                weight: '500'
              }
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              },
              font: {
                size: 11
              }
            }
          }
        },
        onClick: options.onClick,
        ...options
      }
    };
  },

  // Create attendance trend line chart with multiple datasets
  createAttendanceTrendChart(canvasId, labels, dataPoints, label = 'Attendance Rate') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`Canvas element with id '${canvasId}' not found`);
      return null;
    }

    const gradient = this.createGradient(ctx.getContext('2d'), this.colors.gradient.green);

    const data = {
      labels: labels,
      datasets: [{
        label: label,
        data: dataPoints,
        borderColor: this.colors.primary,
        backgroundColor: gradient,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: this.colors.primary,
        pointBorderWidth: 2
      }]
    };

    return new Chart(ctx, this.lineChartConfig(data));
  },

  // Create multi-line attendance trend chart (for all meeting types)
  createMultiLineAttendanceChart(canvasId, labels, datasets) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`Canvas element with id '${canvasId}' not found`);
      return null;
    }

    const chartDatasets = [];
    
    // Lecture dataset (Blue)
    if (datasets.lecture) {
      chartDatasets.push({
        label: 'Lecture',
        data: datasets.lecture,
        borderColor: this.colors.secondary,
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: this.colors.secondary,
        pointBorderWidth: 2
      });
    }
    
    // Office Hours dataset (Orange)
    if (datasets.officeHours) {
      chartDatasets.push({
        label: 'Office Hours',
        data: datasets.officeHours,
        borderColor: this.colors.warning,
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: this.colors.warning,
        pointBorderWidth: 2
      });
    }
    
    // TA Check-in dataset (Green)
    if (datasets.taCheckin) {
      chartDatasets.push({
        label: 'TA Check-ins',
        data: datasets.taCheckin,
        borderColor: this.colors.primary,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: this.colors.primary,
        pointBorderWidth: 2
      });
    }

    const data = {
      labels: labels,
      datasets: chartDatasets
    };

    return new Chart(ctx, this.lineChartConfig(data, { showLegend: true }));
  },

  // Create attendance by type bar chart
  createAttendanceByTypeChart(canvasId, types, rates, onClick) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`Canvas element with id '${canvasId}' not found`);
      return null;
    }

    const colors = [
      this.colors.secondary,
      this.colors.warning,
      this.colors.primary
    ];

    const data = {
      labels: types,
      datasets: [{
        data: rates,
        backgroundColor: colors,
        borderColor: colors.map(c => c),
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: colors.map(c => c + 'dd')
      }]
    };

    return new Chart(ctx, this.barChartConfig(data, { onClick }));
  },

  // Update chart data
  updateChart(chart, newLabels, newData) {
    if (!chart) return;
    
    chart.data.labels = newLabels;
    chart.data.datasets[0].data = newData;
    chart.update();
  },

  // Destroy chart instance
  destroyChart(chart) {
    if (chart) {
      chart.destroy();
    }
  },

  // Get color by attendance rate
  getColorByRate(rate) {
    if (rate >= 90) return this.colors.primary;
    if (rate >= 75) return this.colors.info;
    if (rate >= 60) return this.colors.warning;
    return this.colors.danger;
  },

  // Format percentage
  formatPercentage(value) {
    return Math.round(value * 10) / 10 + '%';
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartHelper;
}