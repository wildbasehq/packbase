import {Elysia} from 'elysia'
import os from 'node:os'

export default new Elysia()
    .get('/health', () => {
        const memoryUsage = process.memoryUsage()
        const cpuUsage = os.loadavg()[0] / os.cpus().length // Normalized CPU usage

        return {
            status: 'healthy',
            timestamp: Date.now(),
            metrics: {
                memory: {
                    rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                },
                cpu: Math.round(cpuUsage * 100) / 100, // CPU load average (1 min)
                connections: 0, // This would be tracked by your application
                uptime: process.uptime(),
            },
            instance: process.env.INSTANCE_ID || 'unknown',
        }
    })
