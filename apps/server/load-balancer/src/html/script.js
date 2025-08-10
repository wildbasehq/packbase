// Configuration
const REFRESH_INTERVAL = 5000; // 5 seconds
const MAX_HISTORY_POINTS = 20; // Number of points to show on charts

// Chart objects
let requestsChart;
let errorRateChart;
let instanceHealthChart;
let resourceUsageChart;

// Initialize charts and start data fetching
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    fetchData();

    // Set up periodic data refresh
    setInterval(fetchData, REFRESH_INTERVAL);

    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', initializeCharts);
});

// Initialize all charts
function initializeCharts() {
    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Define colors based on theme
    const colors = {
        requests: {
            border: isDarkMode ? 'rgb(82, 82, 91)' : 'rgb(163, 163, 163)',
            background: isDarkMode ? 'rgba(82, 82, 91, 0.1)' : 'rgba(163, 163, 163, 0.1)'
        },
        error: {
            border: isDarkMode ? 'rgb(220, 38, 38)' : 'rgb(239, 68, 68)',
            background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(239, 68, 68, 0.1)'
        },
        healthy: {
            border: isDarkMode ? 'rgb(22, 163, 74)' : 'rgb(34, 197, 94)',
            background: isDarkMode ? 'rgba(22, 163, 74, 0.1)' : 'rgba(34, 197, 94, 0.1)'
        },
        primary: {
            border: isDarkMode ? 'rgb(79, 70, 229)' : 'rgb(99, 102, 241)',
            background: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : 'rgba(99, 102, 241, 0.1)'
        }
    };

    // Common chart options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 500
        },
        color: isDarkMode ? 'rgb(212, 212, 216)' : 'rgb(23, 23, 23)',
        borderColor: isDarkMode ? 'rgb(63, 63, 70)' : 'rgb(212, 212, 216)',
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true
            }
        },
        plugins: {
            legend: {
                position: 'top'
            }
        }
    };

    // Requests chart
    const requestsCtx = document.getElementById('requests-chart').getContext('2d');
    requestsChart = new Chart(requestsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Requests',
                data: [],
                borderColor: colors.primary.border,
                backgroundColor: colors.primary.background,
                borderWidth: 2,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Request Count'
                    }
                }
            }
        }
    });

    // Error rate chart
    const errorRateCtx = document.getElementById('error-rate-chart').getContext('2d');
    errorRateChart = new Chart(errorRateCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Error Rate (%)',
                data: [],
                borderColor: colors.error.border,
                backgroundColor: colors.error.background,
                borderWidth: 2,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Error Rate (%)'
                    }
                }
            }
        }
    });

    // Instance health chart
    const instanceHealthCtx = document.getElementById('instance-health-chart').getContext('2d');
    instanceHealthChart = new Chart(instanceHealthCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Total Instances',
                    data: [],
                    borderColor: colors.requests.border,
                    backgroundColor: colors.requests.background,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2
                },
                {
                    label: 'Healthy Instances',
                    data: [],
                    borderColor: colors.healthy.border,
                    backgroundColor: colors.healthy.background,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Instance Count'
                    }
                }
            }
        }
    });

    // Resource usage chart
    const resourceUsageCtx = document.getElementById('resource-usage-chart').getContext('2d');
    resourceUsageChart = new Chart(resourceUsageCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU Usage (%)',
                    data: [],
                    borderColor: colors.primary.border,
                    backgroundColor: colors.primary.background,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2,
                    yAxisID: 'y'
                },
                {
                    label: 'Memory Usage (MB)',
                    data: [],
                    borderColor: colors.requests.border,
                    backgroundColor: colors.requests.background,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2,
                    yAxisID: 'y1'
                },
                {
                    label: 'Connections',
                    data: [],
                    borderColor: colors.healthy.border,
                    backgroundColor: colors.healthy.background,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'CPU (%)'
                    },
                    max: 100,
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Memory (MB)'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                },
                y2: {
                    type: 'linear',
                    display: false,
                    beginAtZero: true
                }
            }
        }
    });
}

// Fetch data from the API
async function fetchData() {
    try {
        const response = await fetch('/stats/api/data/recent');
        const data = await response.json();

        if (data.history && data.history.length > 0) {
            updateDashboard(data.history);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Update the dashboard with new data
function updateDashboard(historyData) {
    // Get the most recent data point
    const latestData = historyData[historyData.length - 1];

    // Update stats overview
    updateStatsOverview(latestData);

    // Update instance table
    updateInstanceTable(latestData);

    // Update charts
    updateCharts(historyData);
}

// Update the stats overview section
function updateStatsOverview(data) {
    // Proxy stats
    document.getElementById('request-count').textContent = data.proxy.requestCount.toLocaleString();
    document.getElementById('error-count').textContent = data.proxy.errorCount.toLocaleString();
    document.getElementById('error-rate').textContent = `${(data.proxy.errorRate).toFixed(2)}%`;

    // Instance stats
    document.getElementById('instance-total').textContent = data.instances.total;
    document.getElementById('instance-healthy').textContent = data.instances.healthy;
    const healthRate = data.instances.total > 0 
        ? ((data.instances.healthy / data.instances.total) * 100).toFixed(1) 
        : '0.0';
    document.getElementById('instance-health-rate').textContent = `${healthRate}%`;

    // Main instance stats
    document.getElementById('main-total').textContent = data.instances.main.total;
    document.getElementById('main-healthy').textContent = data.instances.main.healthy;

    // Chat instance stats
    document.getElementById('chat-total').textContent = data.instances.chat.total;
    document.getElementById('chat-healthy').textContent = data.instances.chat.healthy;

    // Uptime
    const uptime = formatUptime(data.proxy.uptime);
    document.getElementById('uptime').textContent = uptime;

    // Update tab title
    document.title = `✱ VGS - ${data.proxy.requestCount.toLocaleString()}R, ${data.proxy.errorCount.toLocaleString()}E, ${data.instances.total}I`;
}

// Update the instance details table
function updateInstanceTable(data) {
    const tableBody = document.getElementById('instance-table').querySelector('tbody');
    tableBody.innerHTML = '';

    if (!data.instanceDetails || data.instanceDetails.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="empty-state p-4 text-center text-neutral-500 dark:text-neutral-400">No instances available</td>';
        tableBody.appendChild(row);
        return;
    }

    data.instanceDetails.forEach(instance => {
        const row = document.createElement('tr');
        row.className = 'border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 data-[state=selected]:bg-neutral-500/50';

        // Truncate ID for display
        const shortId = instance.id.split('-')[0] + '-' + instance.id.split('-')[1].substring(0, 4) + '...';

        row.innerHTML = `
            <td class="p-4 align-middle" title="${instance.id}">${shortId}</td>
            <td class="p-4 align-middle">${instance.type}</td>
            <td class="p-4 align-middle">
                <span class="health-indicator ${instance.healthy ? 'healthy' : 'unhealthy'}"></span>
                ${instance.healthy ? 'Healthy' : 'Unhealthy'}
            </td>
            <td class="p-4 align-middle">${instance.connections}</td>
            <td class="p-4 align-middle">${instance.cpu ? (instance.cpu * 100).toFixed(1) + '%' : 'N/A'}</td>
            <td class="p-4 align-middle">${instance.memory ? instance.memory.toFixed(1) + ' MB' : 'N/A'}</td>
            <td class="p-4 align-middle">${formatUptime(instance.uptime)}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Update all charts with new data
function updateCharts(historyData) {
    // Limit the number of points to display
    const limitedData = historyData.slice(-MAX_HISTORY_POINTS);

    // Prepare labels (timestamps)
    const labels = limitedData.map(entry => {
        const date = new Date(entry.timestamp);
        return date.toLocaleTimeString();
    });

    // Update requests chart
    requestsChart.data.labels = labels;
    requestsChart.data.datasets[0].data = limitedData.map(entry => entry.proxy.requestCount);
    requestsChart.update();

    // Update error rate chart
    errorRateChart.data.labels = labels;
    errorRateChart.data.datasets[0].data = limitedData.map(entry => entry.proxy.errorRate);
    errorRateChart.update();

    // Update instance health chart
    instanceHealthChart.data.labels = labels;
    instanceHealthChart.data.datasets[0].data = limitedData.map(entry => entry.instances.total);
    instanceHealthChart.data.datasets[1].data = limitedData.map(entry => entry.instances.healthy);
    instanceHealthChart.update();

    // Calculate average resource usage across all instances
    const resourceData = limitedData.map(entry => {
        const instances = entry.instanceDetails || [];
        if (instances.length === 0) return { cpu: 0, memory: 0, connections: 0 };

        const totalCpu = instances.reduce((sum, instance) => sum + (instance.cpu || 0), 0);
        const totalMemory = instances.reduce((sum, instance) => sum + (instance.memory || 0), 0);
        const totalConnections = instances.reduce((sum, instance) => sum + (instance.connections || 0), 0);

        return {
            cpu: instances.length > 0 ? (totalCpu / instances.length) * 100 : 0,
            memory: instances.length > 0 ? totalMemory / instances.length : 0,
            connections: totalConnections
        };
    });

    // Update resource usage chart
    resourceUsageChart.data.labels = labels;
    resourceUsageChart.data.datasets[0].data = resourceData.map(d => d.cpu);
    resourceUsageChart.data.datasets[1].data = resourceData.map(d => d.memory);
    resourceUsageChart.data.datasets[2].data = resourceData.map(d => d.connections);
    resourceUsageChart.update();
}

// Format uptime in a human-readable format
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}