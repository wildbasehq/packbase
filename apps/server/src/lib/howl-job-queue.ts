/**
 * In-memory job queue for deferred howl creation processing
 * Handles S3 uploads and database creation in the background
 */

import prisma from '@/db/prisma'
import Baozi from '@/lib/events'
import {FeedController} from '@/lib/FeedController'
import {clearQueryCache} from '@/lib/search/cache'
import createStorage from '@/lib/storage'
import {xpManager} from '@/lib/trinket-manager'
import {uploadFileStream} from '@/utils/upload-file'
import {createReadStream, existsSync} from 'fs'
import {readFile, unlink} from 'fs/promises'
import path from 'path'

export type HowlJobStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'

export interface HowlJobProgress {
    currentAsset: number
    totalAssets: number
    currentAssetProgress?: number // 0-100 for current asset upload
}

export interface HowlJob {
    id: string // howl UUID
    status: HowlJobStatus
    progress: HowlJobProgress
    error?: string
    createdAt: number
    updatedAt: number
    expiresAt?: number // Only set for failed jobs (5 min expiry)

    // Input data for processing
    userId: string
    tenantId: string
    channelId?: string
    contentType: string
    body: string
    tags: string[]
    assetIds: string[]
}

export interface HowlJobStatusResponse {
    id: string
    status: HowlJobStatus
    progress: HowlJobProgress
    error?: string
    createdAt: number
    updatedAt: number
}

// In-memory storage for jobs
const jobs = new Map<string, HowlJob>()

// Cleanup interval for expired failed jobs (runs every minute)
const CLEANUP_INTERVAL = 60 * 1000
const FAILED_JOB_EXPIRY = 5 * 60 * 1000 // 5 minutes

let cleanupIntervalId: ReturnType<typeof setInterval> | null = null

function startCleanupInterval() {
    if (cleanupIntervalId) return

    cleanupIntervalId = setInterval(() => {
        const now = Date.now()
        for (const [id, job] of jobs.entries()) {
            if (job.expiresAt && now > job.expiresAt) {
                console.log('[HOWL_JOB_QUEUE] Removing expired failed job', {id})
                jobs.delete(id)
            }
        }
    }, CLEANUP_INTERVAL)
}

// Start cleanup on module load
startCleanupInterval()

/**
 * Create a new howl job and add it to the queue
 */
export function createHowlJob(params: {
    id: string
    userId: string
    tenantId: string
    channelId?: string
    contentType: string
    body: string
    tags: string[]
    assetIds: string[]
}): HowlJob {
    const now = Date.now()
    const job: HowlJob = {
        id: params.id,
        status: 'pending',
        progress: {
            currentAsset: 0,
            totalAssets: params.assetIds.length,
        },
        createdAt: now,
        updatedAt: now,
        userId: params.userId,
        tenantId: params.tenantId,
        channelId: params.channelId,
        contentType: params.contentType,
        body: params.body,
        tags: params.tags,
        assetIds: params.assetIds,
    }

    jobs.set(params.id, job)
    console.log('[HOWL_JOB_QUEUE] Created new job', {id: params.id, assetCount: params.assetIds.length})

    return job
}

/**
 * Get job status by howl ID
 */
export function getHowlJobStatus(id: string): HowlJobStatusResponse | null {
    const job = jobs.get(id)
    if (!job) return null

    return {
        id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
    }
}

/**
 * Update job status
 */
function updateJobStatus(id: string, updates: Partial<Pick<HowlJob, 'status' | 'progress' | 'error' | 'expiresAt'>>) {
    const job = jobs.get(id)
    if (!job) return

    Object.assign(job, updates, {updatedAt: Date.now()})
    jobs.set(id, job)
}

/**
 * Mark job as failed with 5-minute expiry
 */
function markJobFailed(id: string, error: string) {
    updateJobStatus(id, {
        status: 'failed',
        error,
        expiresAt: Date.now() + FAILED_JOB_EXPIRY,
    })
    console.log('[HOWL_JOB_QUEUE] Job failed', {id, error})
}

/**
 * Mark job as completed and remove from queue after a delay
 */
function markJobCompleted(id: string) {
    updateJobStatus(id, {status: 'completed'})
    console.log('[HOWL_JOB_QUEUE] Job completed', {id})

    // Keep completed jobs for 1 minute for status polling, then remove
    setTimeout(() => {
        jobs.delete(id)
        console.log('[HOWL_JOB_QUEUE] Removed completed job', {id})
    }, 60 * 1000)
}

/**
 * Process a howl job - uploads assets to S3, creates DB record, updates caches
 * This runs asynchronously in the background
 */
export async function processHowlJob(id: string): Promise<void> {
    const job = jobs.get(id)
    if (!job) {
        console.log('[HOWL_JOB_QUEUE] Job not found for processing', {id})
        return
    }

    console.log('[HOWL_JOB_QUEUE] Starting job processing', {
        id,
        userId: job.userId,
        assetCount: job.assetIds.length,
    })

    const UPLOAD_ROOT = path.join(process.cwd(), 'temp', 'uploads', 'pending')
    const uploadedS3Paths: string[] = []
    const uploadedAssets: {
        type: 'image' | 'video'
        data: {
            url: string
            name: string
        }
    }[] = []

    try {
        // Phase 1: Upload assets to S3
        if (job.assetIds.length > 0) {
            updateJobStatus(id, {status: 'uploading'})

            for (let i = 0; i < job.assetIds.length; i++) {
                const assetId = job.assetIds[i]

                updateJobStatus(id, {
                    progress: {
                        currentAsset: i + 1,
                        totalAssets: job.assetIds.length,
                        currentAssetProgress: 0,
                    },
                })

                console.log('[HOWL_JOB_QUEUE] Processing asset', {
                    jobId: id,
                    assetId,
                    index: i + 1,
                    total: job.assetIds.length,
                })

                const jsonPath = path.join(UPLOAD_ROOT, `${assetId}.json`)
                const binPath = path.join(UPLOAD_ROOT, `${assetId}.bin`)

                if (!existsSync(jsonPath)) {
                    throw new Error(`Asset ID ${assetId} not found`)
                }

                const meta = JSON.parse(await readFile(jsonPath, 'utf-8'))

                if (meta.user_id !== job.userId) {
                    throw new Error(`Asset ID ${assetId} unauthorized`)
                }
                if (meta.state !== 'succeeded') {
                    throw new Error(`Asset ID ${assetId} not finalized`)
                }
                if (meta.expires && Date.now() > meta.expires) {
                    throw new Error(`Asset ID ${assetId} has expired`)
                }

                const contentType = meta.asset_type
                const isVideo = meta.asset_type === 'video/webm' || meta.asset_type.startsWith('video/')

                const stream = createReadStream(binPath)
                const upload = await uploadFileStream(
                    process.env.S3_PROFILES_BUCKET!,
                    `${job.userId}/${id}/${i}.{ext}`,
                    stream,
                    contentType,
                    meta.total_bytes,
                    (uploadedBytes: number, totalBytes: number) => {
                        const percent = Math.round((uploadedBytes / totalBytes) * 100)
                        updateJobStatus(id, {
                            progress: {
                                currentAsset: i + 1,
                                totalAssets: job.assetIds.length,
                                currentAssetProgress: percent,
                            },
                        })
                    }
                )
                stream.destroy()

                if (upload.error) {
                    throw upload.error
                }

                uploadedS3Paths.push(upload.data.path)
                uploadedAssets.push({
                    type: isVideo ? 'video' : 'image',
                    data: {
                        url: upload.data.path,
                        name: `${i}`,
                    },
                })

                // Cleanup temp files
                await unlink(jsonPath).catch((err) => {
                    console.log('[HOWL_JOB_QUEUE] Failed to delete JSON metadata', {assetId, error: err})
                })
                await unlink(binPath).catch((err) => {
                    console.log('[HOWL_JOB_QUEUE] Failed to delete binary file', {assetId, error: err})
                })

                updateJobStatus(id, {
                    progress: {
                        currentAsset: i + 1,
                        totalAssets: job.assetIds.length,
                        currentAssetProgress: 100,
                    },
                })

                console.log('[HOWL_JOB_QUEUE] Asset uploaded', {
                    jobId: id,
                    assetId,
                    s3Path: upload.data.path,
                })
            }
        }

        // Phase 2: Create database record
        updateJobStatus(id, {status: 'processing'})
        console.log('[HOWL_JOB_QUEUE] Creating database record', {jobId: id})

        const dbCreate = await Baozi.trigger('HOWL_CREATE', {
            id: job.id,
            tenant_id: job.tenantId,
            channel_id: job.channelId,
            content_type: job.contentType,
            body: job.body,
            user_id: job.userId,
            tags: job.tags,
            assets: uploadedAssets,
        })

        const data = await prisma.posts.create({data: dbCreate})
        console.log('[HOWL_JOB_QUEUE] Post created', {postId: data.id})

        await xpManager.increment(job.userId, 10, 5)

        // Phase 3: Update user R18 status if necessary
        if (job.tags.includes('rating_suggestive') || job.tags.includes('rating_explicit')) {
            await prisma.profiles.update({
                where: {id: job.userId},
                data: {is_r18: true},
            })
            console.log('[HOWL_JOB_QUEUE] Updated user R18 status', {userId: job.userId})
        }

        // Phase 4: Clear caches
        clearQueryCache(`~${dbCreate.tenant_id}`)
        clearQueryCache(`~${dbCreate.channel_id}`)
        clearQueryCache(`~${dbCreate.user_id}`)

        // Phase 5: Update pack activity
        await prisma.packs.update({
            where: {id: job.tenantId},
            data: {
                last_activity_at: new Date(),
            },
        })

        console.log('[HOWL_JOB_QUEUE] Updated pack activity', {packId: job.tenantId})

        // Update home feed cache
        FeedController.homeFeedCache.forEach((value, key) => {
            if (key.includes(job.userId)) {
                const {data: post} = value
                post.unshift(data)
                value.data = post
                FeedController.homeFeedCache.set(key, value)
            }
        })

        markJobCompleted(id)

    } catch (error: any) {
        console.log('[HOWL_JOB_QUEUE] Job processing failed', {
            jobId: id,
            error: error.message || error,
        })

        // Cleanup uploaded S3 files on failure
        if (uploadedS3Paths.length > 0) {
            console.log('[HOWL_JOB_QUEUE] Cleaning up S3 files', {
                jobId: id,
                count: uploadedS3Paths.length,
            })
            const storage = createStorage(process.env.S3_PROFILES_BUCKET!)
            for (const s3Path of uploadedS3Paths) {
                await storage.deleteFile(job.userId, s3Path.replace(`${job.userId}/`, '')).catch((err) => {
                    console.log('[HOWL_JOB_QUEUE] Failed to cleanup S3 file', {s3Path, error: err})
                })
            }
        }

        markJobFailed(id, error.message || 'Unknown error')
    }
}

/**
 * Start processing a job in the background (fire and forget)
 */
export function enqueueHowlJob(id: string): void {
    // Process asynchronously - don't await
    processHowlJob(id).catch((err) => {
        console.error('[HOWL_JOB_QUEUE] Unhandled error in job processing', {id, error: err})
    })
}

// Export for testing
export function _getJobsMap() {
    return jobs
}
