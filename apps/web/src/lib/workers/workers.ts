import {create} from 'zustand'

/**
 * Cache manager for storing and retrieving job results
 */
class CacheManager {
    private readonly jobId: string
    private store: WorkerState

    constructor(jobId: string, store: WorkerState) {
        this.jobId = jobId
        this.store = store
    }

    /**
     * Get the current cached value
     */
    get<T>(): T | undefined {
        return this.store.cache.get(this.jobId) as T | undefined
    }

    /**
     * Replace the current cached value
     */
    replace<T>(value: T): void {
        this.store.cache.set(this.jobId, value)
    }

    /**
     * Update the cached value using a transform function
     */
    update<T>(transformer: (currentValue: T | undefined) => T): void {
        const currentValue = this.store.cache.get(this.jobId) as T | undefined
        this.store.cache.set(this.jobId, transformer(currentValue))
    }

    /**
     * Clear the cached value
     */
    clear(): void {
        this.store.cache.delete(this.jobId)
    }
}

/**
 * Represents the possible states of a job in the queue
 */
type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * Represents the priority levels available for jobs
 */
type JobPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Represents a job in the queue
 * @interface JobInterface
 */
interface JobInterface {
    /** Unique identifier for the job */
    id: string
    /** The async function to be executed */
    fn: (cache: CacheManager) => Promise<void>
    /** Current status of the job */
    status: JobStatus
    /** Priority level of the job */
    priority: JobPriority
    /** Number of attempts made to execute this job */
    attempts: number
    /** Maximum number of retry attempts allowed */
    maxAttempts: number
    /** Timeout duration in milliseconds */
    timeoutMs: number
    /** Timestamp when the job was queued */
    queuedAt: Date
    /** Timestamp when the job started executing */
    startedAt?: Date
    /** Timestamp when the job completed (success or failure) */
    completedAt?: Date
    /** Error information if the job failed */
    error?: Error
    /** Timeout identifier for job execution */
    timeoutId?: NodeJS.Timeout
}

/**
 * Configuration options for enqueueing a new job
 */
interface JobOptions {
    /** Priority level for the job */
    priority?: JobPriority
    /** Custom timeout in milliseconds */
    timeoutMs?: number
    /** Maximum number of retry attempts */
    maxAttempts?: number
}

/**
 * Main worker state interface defining the job queue functionality
 * @interface WorkerState
 */
interface WorkerState {
    /** Maximum number of jobs that can be in the queue */
    readonly MAX_QUEUE_SIZE: number
    /** Maximum number of concurrent jobs */
    readonly MAX_CONCURRENT_JOBS: number
    /** Default timeout for jobs in milliseconds */
    readonly DEFAULT_TIMEOUT_MS: number
    /** Default maximum retry attempts */
    readonly DEFAULT_MAX_ATTEMPTS: number

    /** Map of all jobs indexed by their IDs */
    jobs: Map<string, JobInterface>
    /** Separate queues for each priority level */
    queues: Record<JobPriority, string[]>
    /** Cache manager for storing job results */
    cache: Map<string, any>

    /**
     * Adds a new job to the queue
     * @param id - Unique identifier for the job
     * @param fn - Async function to be executed
     * @param options - Optional configuration for the job
     * @returns boolean indicating if the job was successfully queued
     */
    enqueue: (id: string, fn: (cache: CacheManager) => Promise<void>, options?: JobOptions) => boolean

    /**
     * Processes the next job in the queue according to priority
     */
    process: () => void

    /**
     * Cancels a running or queued job
     * @param id - ID of the job to cancel
     */
    cancel: (id: string) => void

    /**
     * Retries a failed job
     * @param id - ID of the job to retry
     */
    retry: (id: string) => void

    /**
     * Removes completed jobs older than 1 hour
     */
    cleanup: () => void

    /**
     * Returns all currently running jobs
     * @returns Array of running Job objects
     */
    getRunningJobs: () => JobInterface[]

    /**
     * Returns all queued jobs
     * @returns Array of queued Job objects
     */
    getQueuedJobs: () => JobInterface[]

    /**
     * Gets the current status of a job
     * @param id - ID of the job to check
     * @returns Current status of the job or undefined if not found
     */
    getJobStatus: (id: string) => JobStatus | undefined

    /**
     * Clears the cache for a specific job
     * @param id - ID of the job to clear cache for
     */
    clearCache: (id: string) => void

    /**
     * Gets the cached value for a specific job
     * @param id - ID of the job to get cached value for
     * @returns Cached value or undefined if not found
     */
    getCachedValue: <T>(id: string) => T | undefined
}

export const WorkerStore = create<WorkerState>((set, get) => ({
    MAX_QUEUE_SIZE: 1000,
    MAX_CONCURRENT_JOBS: 5,
    DEFAULT_TIMEOUT_MS: 30000, // 30 seconds
    DEFAULT_MAX_ATTEMPTS: 3,

    jobs: new Map(),
    queues: {
        critical: [],
        high: [],
        medium: [],
        low: []
    },
    cache: new Map(),

    enqueue: (id, fn, options = {}) => {
        const state = get()
        const totalQueuedJobs = Object.values(state.queues)
            .reduce((sum, queue) => sum + queue.length, 0)

        if (totalQueuedJobs >= state.MAX_QUEUE_SIZE) {
            log.error('Worker', `Queue is full. Rejected job ${id}`)
            return false
        }

        const existingJob = state.jobs.get(id)
        if (existingJob) {
            if (!['completed', 'failed', 'cancelled'].includes(existingJob.status)) {
                log.error('Worker', `Job ${id} already exists and is ${existingJob.status}`)
                return false
            }
            state.jobs.delete(id)
        }

        const priority = options.priority || 'medium'
        const timeoutMs = options.timeoutMs || state.DEFAULT_TIMEOUT_MS
        const maxAttempts = options.maxAttempts || state.DEFAULT_MAX_ATTEMPTS

        const job: JobInterface = {
            id,
            fn,
            status: 'queued',
            priority,
            attempts: 0,
            maxAttempts,
            timeoutMs,
            queuedAt: new Date()
        }

        set(state => ({
            jobs: new Map(state.jobs).set(id, job),
            queues: {
                ...state.queues,
                [priority]: [...state.queues[priority], id]
            }
        }))

        log.info('Worker', `Queued job ${id} with priority ${priority}`)
        return true
    },

    process: () => {
        const state = get()
        const runningJobs = state.getRunningJobs()

        if (runningJobs.length >= state.MAX_CONCURRENT_JOBS) {
            return
        }

        const priorities: JobPriority[] = ['critical', 'high', 'medium', 'low']

        for (const priority of priorities) {
            const queue = state.queues[priority]
            if (queue.length === 0) continue

            const jobId = queue[0]
            const job = state.jobs.get(jobId)
            if (!job) continue

            job.status = 'running'
            job.startedAt = new Date()
            job.attempts++

            job.timeoutId = setTimeout(() => {
                const currentJob = get().jobs.get(jobId)
                if (currentJob?.status === 'running') {
                    log.error('Worker', `Job ${jobId} timed out after ${job.timeoutMs}ms`)
                    handleJobFailure(jobId, new Error('Job timeout'))
                }
            }, job.timeoutMs)

            // Create cache manager instance for this job
            const cacheManager = new CacheManager(jobId, get())

            job.fn(cacheManager)
                .then(() => handleJobSuccess(jobId))
                .catch(error => handleJobFailure(jobId, error))

            set(state => ({
                jobs: new Map(state.jobs).set(jobId, job),
                queues: {
                    ...state.queues,
                    [priority]: state.queues[priority].slice(1)
                }
            }))

            break
        }
    },

    clearCache: (id) => {
        set(state => {
            const newCache = new Map(state.cache)
            newCache.delete(id)
            return {cache: newCache}
        })
    },

    getCachedValue: (id) => {
        return get().cache.get(id)
    },

    cancel: (id) => {
        const state = get()
        const job = state.jobs.get(id)

        if (!job) {
            log.warn('Worker', `Cannot cancel job ${id}: not found`)
            return
        }

        if (job.timeoutId) {
            clearTimeout(job.timeoutId)
        }

        if (job.status === 'running' || job.status === 'queued') {
            job.status = 'cancelled'
            job.completedAt = new Date()

            set(state => ({
                jobs: new Map(state.jobs).set(id, job),
                queues: {
                    ...state.queues,
                    [job.priority]: state.queues[job.priority]
                        .filter(queuedId => queuedId !== id)
                }
            }))

            log.info('Worker', `Cancelled job ${id}`)
        }
    },

    retry: (id) => {
        const state = get()
        const job = state.jobs.get(id)

        if (!job) {
            log.warn('Worker', `Cannot retry job ${id}: not found`)
            return
        }

        if (job.status !== 'failed') {
            log.warn('Worker', `Cannot retry job ${id}: not in failed state: ${job.status}`)
            return
        }

        // Reset job state for retry
        job.status = 'queued'
        job.error = undefined
        job.startedAt = undefined
        job.completedAt = undefined

        set(state => ({
            jobs: new Map(state.jobs).set(id, job),
            queues: {
                ...state.queues,
                [job.priority]: [...state.queues[job.priority], id]
            }
        }))

        log.info('Worker', `Requeued job ${id} for retry`)
    },

    cleanup: () => {
        const state = get()
        const now = new Date()
        const ONE_HOUR = 60 * 60 * 1000

        // Remove completed/failed/cancelled jobs older than 1 hour
        const newJobs = new Map(state.jobs)
        for (const [id, job] of state.jobs.entries()) {
            if (
                job.completedAt &&
                ['completed', 'failed', 'cancelled'].includes(job.status) &&
                now.getTime() - job.completedAt.getTime() > ONE_HOUR
            ) {
                newJobs.delete(id)
            }
        }

        set({jobs: newJobs})
    },

    getRunningJobs: () => {
        const state = get()
        return Array.from(state.jobs.values())
            .filter(job => job.status === 'running')
    },

    getQueuedJobs: () => {
        const state = get()
        return Array.from(state.jobs.values())
            .filter(job => job.status === 'queued')
    },

    getJobStatus: (id) => {
        return get().jobs.get(id)?.status
    }
}))

// Helper functions for job completion handling
function handleJobSuccess(id: string) {
    const job = WorkerStore.getState().jobs.get(id)
    if (!job || job.status !== 'running') return

    if (job.timeoutId) {
        clearTimeout(job.timeoutId)
    }

    job.status = 'completed'
    job.completedAt = new Date()

    WorkerStore.setState(state => ({
        jobs: new Map(state.jobs).set(id, job)
    }))

    log.info('Worker', `Job ${id} completed successfully`)
}

function handleJobFailure(id: string, error: Error) {
    const job = WorkerStore.getState().jobs.get(id)
    if (!job || job.status !== 'running') return

    if (job.timeoutId) {
        clearTimeout(job.timeoutId)
    }

    // Check if we should retry
    if (job.attempts < job.maxAttempts) {
        job.status = 'queued'
        WorkerStore.setState(state => ({
            jobs: new Map(state.jobs).set(id, job),
            queues: {
                ...state.queues,
                [job.priority]: [...state.queues[job.priority], id]
            }
        }))
        log.warn('Worker', `Job ${id} failed, retrying. Attempt ${job.attempts}/${job.maxAttempts}`)
    } else {
        job.status = 'failed'
        job.completedAt = new Date()
        job.error = error

        WorkerStore.setState(state => ({
            jobs: new Map(state.jobs).set(id, job)
        }))
        log.error('Worker', `Job ${id} failed permanently after ${job.attempts} attempts:`, error)
    }
}

// Start the processing loop
const processingInterval = setInterval(() => {
    WorkerStore.getState().process()
}, 500)

// Start the cleanup loop (runs every hour)
const cleanupInterval = setInterval(() => {
    WorkerStore.getState().cleanup()
}, 60 * 60 * 1000)

// Cleanup function for when the worker is no longer needed
export function shutdownWorker() {
    clearInterval(processingInterval)
    clearInterval(cleanupInterval)

    // Cancel all running jobs
    const runningJobs = WorkerStore.getState().getRunningJobs()
    runningJobs.forEach(job => WorkerStore.getState().cancel(job.id))
}