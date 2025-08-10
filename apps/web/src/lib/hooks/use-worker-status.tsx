/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'
import { Loader2 } from 'lucide-react'
import { WorkerStore } from '@/lib/workers'
import { LoadingSpinner } from '@/components/icons'
import Tooltip from '@/components/shared/tooltip.tsx'

// Custom hook to track running jobs
const useRunningWorkers = () => {
    const runningJobs = WorkerStore(state => state.getRunningJobs())
    const queuedJobs = WorkerStore(state => state.getQueuedJobs())
    const isQueueActive = runningJobs.length > 0 || queuedJobs.length > 0

    // Optionally return more details about running jobs
    return {
        isQueueActive,
        runningCount: runningJobs.length,
        queuedCount: queuedJobs.length,
        jobs: runningJobs,
        queue: queuedJobs,
    }
}

// Simple spinner component that shows when any job is running
const WorkerSpinner = () => {
    const { isQueueActive, runningCount, queuedCount, jobs } = useRunningWorkers()
    if (!isQueueActive) return null

    return (
        <>
            <Tooltip
                content={
                    <div className="flex flex-col gap-2 p-4">
                        <div className="text-xs">Tasks in progress:</div>
                        {jobs.map((job, i) => (
                            <div key={i} className="text-xs truncate">
                                {job.id}
                            </div>
                        ))}
                    </div>
                }
            >
                <div className="flex scale-80 ">
                    <LoadingSpinner className="!transform-[scale(0.3)]" />{' '}
                    <span className="text-xs inline-flex items-center -ml-4">{runningCount + queuedCount} working</span>
                </div>
            </Tooltip>

            <div className="md:dark:bg-white/15 hidden md:block md:h-5 md:w-px md:bg-n-8/10" />
        </>
    )
}

// Alternative version that tracks specific job IDs
const useWorkerStatus = jobId => {
    const status = WorkerStore(state => state.getJobStatus(jobId))
    return status === 'running'
}

// Component that shows spinner for specific jobs
const WorkerSpecificSpinner = ({ jobId }) => {
    const isRunning = useWorkerStatus(jobId)

    if (!isRunning) return null

    return (
        <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            <span className="text-sm text-gray-600">Processing...</span>
        </div>
    )
}

export { WorkerSpinner, WorkerSpecificSpinner, useRunningWorkers, useWorkerStatus }
