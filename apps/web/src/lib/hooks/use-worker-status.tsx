/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {LoadingSpinner} from '@/components/icons'
import Tooltip from '@/components/shared/tooltip'
import {WorkerStore} from '@/lib/workers'

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
    const {isQueueActive, jobs} = useRunningWorkers()
    if (!isQueueActive) return <></>

    return (
        <>
            <Tooltip
                content={
                    <div className="flex flex-col gap-2">
                        <div className="text-xs">Tasks in progress:</div>
                        {jobs.map((job, i) => (
                            <div key={i} className="text-xs truncate">
                                {job.id}
                            </div>
                        ))}
                    </div>
                }
            >
                <LoadingSpinner/>
            </Tooltip>
        </>
    )
}

export {WorkerSpinner, useRunningWorkers}
