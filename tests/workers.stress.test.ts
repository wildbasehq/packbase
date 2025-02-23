// @ts-ignore
import {afterEach, beforeEach, describe, expect, test} from 'bun:test'
import {shutdownWorker, WorkerStore} from '@/lib/workers'
import '@/lib/utils'

interface JobMetrics {
    jobId: string;
    queueTime: number;    // Time spent in queue
    processTime: number;  // Time to process
    totalTime: number;    // Total time from enqueue to completion
    priority: string;     // Job priority level
    attempts: number;     // Number of attempts needed
    status: string;       // Final status
}

describe('WorkerStore Stress Tests', () => {
    beforeEach(() => {
        WorkerStore.setState({
            jobs: new Map(),
            queues: {
                critical: [],
                high: [],
                medium: [],
                low: []
            }
        })
    })

    afterEach(() => {
        shutdownWorker()
    })

    test('should handle 100 concurrent jobs with varying priorities and processing times', async () => {
        const NUM_JOBS = 100
        const metrics: JobMetrics[] = []
        const startTime = Date.now()

        // Create jobs with different priorities and processing times
        const priorities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low']
        const jobs = Array.from({length: NUM_JOBS}, (_, i) => ({
            id: `stress-job-${i}`,
            priority: priorities[i % priorities.length],
            processingTime: Math.floor(Math.random() * 75) + 25
        }))

        // Helper to create a promise that resolves after a specified time
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        // Enqueue all jobs and collect their start times
        const jobStartTimes = new Map<string, number>()
        const jobQueueTimes = new Map<string, number>()

        for (const job of jobs) {
            jobQueueTimes.set(job.id, Date.now())

            WorkerStore.getState().enqueue(
                job.id,
                async () => {
                    jobStartTimes.set(job.id, Date.now())
                    await delay(job.processingTime)

                    // Randomly fail some jobs to test retry mechanism
                    if (Math.random() < 0.1) { // 10% failure rate
                        throw new Error('Random failure')
                    }
                },
                {
                    priority: job.priority,
                    maxAttempts: 3,
                    timeoutMs: 1000
                }
            )
        }

        // Start processing
        const processInterval = setInterval(() => {
            WorkerStore.getState().process()
        })

        // Wait for all jobs to complete or fail
        let allJobsComplete = false
        const maxWaitTime = 30000 // 30 seconds maximum wait
        const waitStartTime = Date.now()

        while (!allJobsComplete && Date.now() - waitStartTime < maxWaitTime) {
            const allJobs = Array.from(WorkerStore.getState().jobs.values())
            allJobsComplete = allJobs.every(job =>
                job.status === 'completed' ||
                job.status === 'failed' ||
                job.status === 'cancelled'
            )

            if (!allJobsComplete) {
                await delay(10)
            }
        }

        clearInterval(processInterval)

        // Collect metrics for all jobs
        for (const job of Array.from(WorkerStore.getState().jobs.values())) {
            const queueTime = (jobStartTimes.get(job.id) || 0) - (jobQueueTimes.get(job.id) || 0)
            const processTime = (job.completedAt?.getTime() || 0) - (jobStartTimes.get(job.id) || 0)
            const totalTime = (job.completedAt?.getTime() || 0) - (jobQueueTimes.get(job.id) || 0)

            metrics.push({
                jobId: job.id,
                queueTime,
                processTime,
                totalTime,
                priority: job.priority,
                attempts: job.attempts,
                status: job.status
            })
        }

        // Calculate statistics
        const totalEndTime = Date.now()
        const totalExecutionTime = totalEndTime - startTime

        const stats = {
            totalJobs: metrics.length,
            completedJobs: metrics.filter(m => m.status === 'completed').length,
            failedJobs: metrics.filter(m => m.status === 'failed').length,
            cancelledJobs: metrics.filter(m => m.status === 'cancelled').length,
            totalExecutionTime,
            averageQueueTime: metrics.reduce((acc, m) => acc + m.queueTime, 0) / metrics.length,
            averageProcessTime: metrics.reduce((acc, m) => acc + m.processTime, 0) / metrics.length,
            averageTotalTime: metrics.reduce((acc, m) => acc + m.totalTime, 0) / metrics.length,
            maxQueueTime: Math.max(...metrics.map(m => m.queueTime)),
            maxProcessTime: Math.max(...metrics.map(m => m.processTime)),
            maxTotalTime: Math.max(...metrics.map(m => m.totalTime)),
            retryRate: metrics.filter(m => m.attempts > 1).length / metrics.length,
            priorityStats: {
                critical: metrics.filter(m => m.priority === 'critical').length,
                high: metrics.filter(m => m.priority === 'high').length,
                medium: metrics.filter(m => m.priority === 'medium').length,
                low: metrics.filter(m => m.priority === 'low').length
            },
            priorityAvgTimes: {
                critical: calculateAverageTimeByPriority(metrics, 'critical'),
                high: calculateAverageTimeByPriority(metrics, 'high'),
                medium: calculateAverageTimeByPriority(metrics, 'medium'),
                low: calculateAverageTimeByPriority(metrics, 'low')
            }
        }

        // Assertions
        expect(stats.totalJobs).toBe(NUM_JOBS)
        expect(stats.completedJobs + stats.failedJobs + stats.cancelledJobs).toBe(NUM_JOBS)
        expect(stats.totalExecutionTime).toBeLessThan(maxWaitTime)

        // Priority ordering assertions
        expect(stats.priorityAvgTimes.critical).toBeLessThan(stats.priorityAvgTimes.low)
        expect(stats.priorityAvgTimes.high).toBeLessThan(stats.priorityAvgTimes.low)

        // Performance assertions
        expect(stats.averageQueueTime).toBeLessThan(5000) // Average queue time should be under 5 seconds
        expect(stats.maxQueueTime).toBeLessThan(10000)    // Max queue time should be under 10 seconds

        // Resource management assertions
        expect(WorkerStore.getState().getRunningJobs().length).toBe(0)
        expect(Object.values(WorkerStore.getState().queues).flat().length).toBe(0)

        // Log detailed statistics
        console.log('Stress Test Statistics:', JSON.stringify(stats, null, 2))

        // Return stats for potential further analysis
        return stats
    })
})

// Helper function to calculate average time by priority
function calculateAverageTimeByPriority(metrics: JobMetrics[], priority: string): number {
    const priorityMetrics = metrics.filter(m => m.priority === priority)
    if (priorityMetrics.length === 0) return 0
    return priorityMetrics.reduce((acc, m) => acc + m.totalTime, 0) / priorityMetrics.length
}