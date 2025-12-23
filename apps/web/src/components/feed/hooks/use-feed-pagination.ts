/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useEffect, useRef} from 'react'
import {useSearchParams} from 'wouter'

interface UseFeedPaginationProps {
    packID: string
    channelID?: string
}

export function useFeedPagination({packID, channelID}: UseFeedPaginationProps) {
    const [searchParams, setSearchParams] = useSearchParams()
    const prevPackIDRef = useRef(packID)
    const prevChannelIDRef = useRef(channelID)

    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1
    const setPage = (newPage: number) => setSearchParams({page: newPage.toString()}, {
        replace: page === newPage || page !== newPage,
    })

    // Reset to page 1 when packID or channelID changes
    useEffect(() => {
        const packIDChanged = packID !== prevPackIDRef.current
        const channelIDChanged = channelID !== prevChannelIDRef.current

        if (packIDChanged || channelIDChanged) {
            prevPackIDRef.current = packID
            prevChannelIDRef.current = channelID
            setPage(1)
        }
    }, [packID, channelID, setPage])

    return {page, setPage}
}
