// @ts-ignore
import {afterEach, beforeEach, describe, expect, mock, test} from 'bun:test'
import {shutdownWorker, WorkerStore} from '@/lib/workers'
import '@/lib/utils'

describe('WorkerStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        WorkerStore.setState({
            jobs: new Map(),
            queues: {
                critical: [],
                high: [],
                medium: [],
                low: []
            },
            cache: new Map() // Add cache reset
        })
    })

    afterEach(() => {
        // Cleanup after each test
        shutdownWorker()
    })

    describe('cache functionality', () => {
        test('should allow jobs to store and retrieve cached data', async () => {
            const jobId = 'cache-test-job'
            const testData = {key: 'value'}
            let retrievedData = null

            // First job stores data
            await new Promise<void>(resolve => {
                WorkerStore.getState().enqueue(jobId, async (cache) => {
                    cache.replace(testData)
                    resolve()
                })
                WorkerStore.getState().process()
            })

            // Second job retrieves data
            await new Promise<void>(resolve => {
                WorkerStore.getState().enqueue(jobId, async (cache) => {
                    retrievedData = cache.get()
                    resolve()
                })
                WorkerStore.getState().process()
            })

            expect(retrievedData).toEqual(testData)
        })

        test('should allow clearing cache for specific jobs', async () => {
            const jobId = 'cache-clear-test'
            const testData = {key: 'value'}

            // Store data
            await new Promise<void>(resolve => {
                WorkerStore.getState().enqueue(jobId, async (cache) => {
                    cache.replace(testData)
                    resolve()
                })
                WorkerStore.getState().process()
            })

            // Clear cache
            WorkerStore.getState().clearCache(jobId)

            // Verify cache is cleared
            const cachedValue = WorkerStore.getState().getCachedValue(jobId)
            expect(cachedValue).toBeUndefined()
        })

        test('should allow updating cached data with transform function', async () => {
            const jobId = 'cache-update-test'
            const initialData = [1, 2, 3]
            let finalData = null

            // Store initial data
            await new Promise<void>(resolve => {
                WorkerStore.getState().enqueue(jobId, async (cache) => {
                    cache.replace(initialData)
                    resolve()
                })
                WorkerStore.getState().process()
            })

            // Update data using transform
            await new Promise<void>(resolve => {
                WorkerStore.getState().enqueue(jobId, async (cache) => {
                    cache.update<number[]>(currentData => currentData ? [...currentData, 4] : [4])
                    finalData = cache.get()
                    resolve()
                })
                WorkerStore.getState().process()
            })

            expect(finalData).toEqual([1, 2, 3, 4])
        })

        test('should maintain separate caches for different jobs', async () => {
            const jobOneID = 'cache-job-1'
            const jobTwoID = 'cache-job-2'
            const dataOne = {job: 1}
            const dataTwo = {job: 2}

            // Store data for both jobs
            await Promise.all([
                new Promise<void>(resolve => {
                    WorkerStore.getState().enqueue(jobOneID, async (cache) => {
                        cache.replace(dataOne)
                        resolve()
                    })
                    WorkerStore.getState().process()
                }),
                new Promise<void>(resolve => {
                    WorkerStore.getState().enqueue(jobTwoID, async (cache) => {
                        cache.replace(dataTwo)
                        resolve()
                    })
                    WorkerStore.getState().process()
                })
            ])

            const cacheOne = WorkerStore.getState().getCachedValue(jobOneID)
            const cacheTwo = WorkerStore.getState().getCachedValue(jobTwoID)

            expect(cacheOne).toEqual(dataOne)
            expect(cacheTwo).toEqual(dataTwo)
        })
    })

    describe('enqueue', () => {
        test('should successfully enqueue a job with default settings', () => {
            const jobId = 'test-job-1'
            const jobFn = async () => {
            }

            const result = WorkerStore.getState().enqueue(jobId, jobFn)

            expect(result).toBe(true)
            expect(WorkerStore.getState().jobs.has(jobId)).toBe(true)

            const job = WorkerStore.getState().jobs.get(jobId)
            expect(job).toBeDefined()
            expect(job?.status).toBe('queued')
            expect(job?.priority).toBe('medium')
            expect(job?.attempts).toBe(0)
            expect(job?.maxAttempts).toBe(WorkerStore.getState().DEFAULT_MAX_ATTEMPTS)
            expect(job?.timeoutMs).toBe(WorkerStore.getState().DEFAULT_TIMEOUT_MS)
        })

        test('should enqueue a job with custom settings', () => {
            const jobId = 'test-job-2'
            const jobFn = async () => {
            }
            const options = {
                priority: 'high' as const,
                timeoutMs: 60000,
                maxAttempts: 5
            }

            const result = WorkerStore.getState().enqueue(jobId, jobFn, options)

            expect(result).toBe(true)
            const job = WorkerStore.getState().jobs.get(jobId)
            expect(job?.priority).toBe('high')
            expect(job?.timeoutMs).toBe(60000)
            expect(job?.maxAttempts).toBe(5)
        })

        test('should reject duplicate job IDs', () => {
            const jobId = 'test-job-3'
            const jobFn = async () => {
            }

            const firstResult = WorkerStore.getState().enqueue(jobId, jobFn)
            const secondResult = WorkerStore.getState().enqueue(jobId, jobFn)

            expect(firstResult).toBe(true)
            expect(secondResult).toBe(false)
        })

        test('should respect MAX_QUEUE_SIZE limit', () => {
            const maxSize = WorkerStore.getState().MAX_QUEUE_SIZE

            // Fill the queue
            for (let i = 0; i < maxSize; i++) {
                WorkerStore.getState().enqueue(`job-${i}`, async () => {
                })
            }

            // Try to add one more
            const result = WorkerStore.getState().enqueue('overflow-job', async () => {
            })

            expect(result).toBe(false)
        })
    })

    describe('process', () => {
        test('should process jobs in priority order', async () => {
            const processed: string[] = []

            // Add jobs with different priorities
            WorkerStore.getState().enqueue('low-job', async () => {
                processed.push('low')
            }, {priority: 'low'})

            WorkerStore.getState().enqueue('high-job', async () => {
                processed.push('high')
            }, {priority: 'high'})

            WorkerStore.getState().enqueue('critical-job', async () => {
                processed.push('critical')
            }, {priority: 'critical'})

            // Process jobs
            WorkerStore.getState().process()
            WorkerStore.getState().process()
            WorkerStore.getState().process()

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 100))

            expect(processed).toEqual(['critical', 'high', 'low'])
        })

        test('should respect MAX_CONCURRENT_JOBS limit', async () => {
            const maxConcurrent = WorkerStore.getState().MAX_CONCURRENT_JOBS
            let runningCount = 0
            let maxObservedRunning = 0

            // Create jobs that track concurrent execution
            for (let i = 0; i < maxConcurrent + 2; i++) {
                WorkerStore.getState().enqueue(`job-${i}`, async () => {
                    runningCount++
                    maxObservedRunning = Math.max(maxObservedRunning, runningCount)
                    await new Promise(resolve => setTimeout(resolve, 50))
                    runningCount--
                })
            }

            // Process jobs
            WorkerStore.getState().process()

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 200))

            expect(maxObservedRunning).toBeLessThanOrEqual(maxConcurrent)
        })

        test('should handle job timeouts', async () => {
            const jobId = 'timeout-job'
            const timeoutMs = 10

            WorkerStore.getState().enqueue(jobId, async () => {
                await new Promise(resolve => setTimeout(resolve, timeoutMs * 2))
            }, {timeoutMs, maxAttempts: 1})

            WorkerStore.getState().process()

            // Wait for timeout
            await new Promise(resolve => setTimeout(resolve, timeoutMs + 50))

            const job = WorkerStore.getState().jobs.get(jobId)
            expect(job?.status).toBe('failed')
            expect(job?.error?.message).toContain('timeout')
        })
    })

    describe('retry mechanism', () => {
        test('should retry failed jobs up to maxAttempts', async () => {
            const jobId = 'retry-job'
            const maxAttempts = 3
            let attempts = 0

            // Create a Promise that resolves when all attempts are completed
            const allAttemptsComplete = new Promise<void>(resolve => {
                WorkerStore.getState().enqueue(jobId, async () => {
                    attempts++
                    throw new Error('Test error')
                }, {maxAttempts})

                // Check job status periodically
                const checkInterval = setInterval(() => {
                    const job = WorkerStore.getState().jobs.get(jobId)
                    if (job?.status === 'failed') {
                        clearInterval(checkInterval)
                        resolve()
                    }
                }, 50)
            })

            // Start continuous processing
            const processInterval = setInterval(() => {
                WorkerStore.getState().process()
            }, 50)

            // Wait for all attempts to complete
            await allAttemptsComplete

            // Clean up interval
            clearInterval(processInterval)

            const job = WorkerStore.getState().jobs.get(jobId)
            expect(attempts).toBe(maxAttempts)
            expect(job?.status).toBe('failed')
        })

        test('should allow manual retry of failed jobs', async () => {
            const jobId = 'manual-retry-job'
            let attempts = 0

            // Create a Promise that resolves when the initial attempt fails
            const initialFailure = new Promise<void>(resolve => {
                WorkerStore.getState().enqueue(jobId, async () => {
                    attempts++
                    throw new Error('Test error')
                }, {maxAttempts: 1}) // Set maxAttempts to 1 to ensure it fails after first attempt

                // Check job status periodically
                const checkInterval = setInterval(() => {
                    const job = WorkerStore.getState().jobs.get(jobId)
                    if (job?.status === 'failed') {
                        clearInterval(checkInterval)
                        resolve()
                    }
                }, 50)
            })

            // Start continuous processing
            const processInterval = setInterval(() => {
                WorkerStore.getState().process()
            }, 50)

            // Wait for initial failure
            await initialFailure

            // Create a Promise for the retry attempt
            const retryComplete = new Promise<void>(resolve => {
                // Start checking for the second attempt
                const checkInterval = setInterval(() => {
                    if (attempts === 2) {
                        clearInterval(checkInterval)
                        resolve()
                    }
                }, 50)
            })

            // Manual retry
            WorkerStore.getState().retry(jobId)

            // Wait for retry to complete
            await retryComplete

            // Clean up
            clearInterval(processInterval)

            // Verify attempts and final status
            expect(attempts).toBe(2)
            const finalJob = WorkerStore.getState().jobs.get(jobId)
            expect(finalJob?.status).toBe('failed')
        })
    })

    describe('cancellation', () => {
        test('should cancel queued jobs', () => {
            const jobId = 'cancel-queued-job'

            WorkerStore.getState().enqueue(jobId, async () => {
            })
            WorkerStore.getState().cancel(jobId)

            const job = WorkerStore.getState().jobs.get(jobId)
            expect(job?.status).toBe('cancelled')
        })

        test('should cancel running jobs', async () => {
            const jobId = 'cancel-running-job'

            WorkerStore.getState().enqueue(jobId, async () => {
                await new Promise(resolve => setTimeout(resolve, 1000))
            })

            WorkerStore.getState().process()

            // Wait for job to start
            await new Promise(resolve => setTimeout(resolve, 50))

            WorkerStore.getState().cancel(jobId)

            const job = WorkerStore.getState().jobs.get(jobId)
            expect(job?.status).toBe('cancelled')
        })
    })

    describe('cleanup', () => {
        test('should remove old completed jobs', async () => {
            const jobId = 'old-completed-job'

            // Add a job that completes immediately
            WorkerStore.getState().enqueue(jobId, async () => {
            })
            WorkerStore.getState().process()

            // Wait for completion
            await new Promise(resolve => setTimeout(resolve, 50))

            // Modify completion timestamp to be old
            const job = WorkerStore.getState().jobs.get(jobId)
            if (job?.completedAt) {
                job.completedAt = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours old
            }

            WorkerStore.getState().cleanup()

            expect(WorkerStore.getState().jobs.has(jobId)).toBe(false)
        })
    })

    describe('monitoring', () => {
        test('should track running jobs', async () => {
            const jobId = 'monitor-running-job'

            WorkerStore.getState().enqueue(jobId, async () => {
                await new Promise(resolve => setTimeout(resolve, 100))
            })

            WorkerStore.getState().process()

            // Check immediately after processing starts
            const runningJobs = WorkerStore.getState().getRunningJobs()
            expect(runningJobs.length).toBe(1)
            expect(runningJobs[0].id).toBe(jobId)
        })

        test('should track queued jobs', () => {
            const jobIds = ['queued-1', 'queued-2', 'queued-3']

            jobIds.forEach(id => {
                WorkerStore.getState().enqueue(id, async () => {
                })
            })

            const queuedJobs = WorkerStore.getState().getQueuedJobs()
            expect(queuedJobs.length).toBe(3)
            expect(queuedJobs.map(job => job.id)).toEqual(jobIds)
        })

        test('should provide accurate job status', async () => {
            const jobId = 'status-track-job'

            // Check initial status after enqueueing
            WorkerStore.getState().enqueue(jobId, async () => {
                await new Promise(resolve => setTimeout(resolve, 100))
            })
            expect(WorkerStore.getState().getJobStatus(jobId)).toBe('queued')

            // Check status while running
            WorkerStore.getState().process()
            await new Promise(resolve => setTimeout(resolve, 50))
            expect(WorkerStore.getState().getJobStatus(jobId)).toBe('running')

            // Check status after completion
            await new Promise(resolve => setTimeout(resolve, 100))
            expect(WorkerStore.getState().getJobStatus(jobId)).toBe('completed')
        })
    })

    describe('error handling', () => {
        test('should handle and store job errors', async () => {
            const jobId = 'error-job'
            const errorMessage = 'Test error message'

            WorkerStore.getState().enqueue(jobId, async () => {
                throw new Error(errorMessage)
            }, {maxAttempts: 1})

            WorkerStore.getState().process()

            // Wait for job to fail
            await new Promise(resolve => setTimeout(resolve, 100))

            const job = WorkerStore.getState().jobs.get(jobId)
            expect(job?.status).toBe('failed')
            expect(job?.error?.message).toBe(errorMessage)
        })

        test('should handle invalid job IDs gracefully', () => {
            expect(() => WorkerStore.getState().cancel('non-existent-job')).not.toThrow()
            expect(() => WorkerStore.getState().retry('non-existent-job')).not.toThrow()
            expect(WorkerStore.getState().getJobStatus('non-existent-job')).toBeUndefined()
        })
    })
})