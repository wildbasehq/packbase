/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useEffect} from 'react'

interface UseFeedTitleProps {
    page: number
    titleOverride?: string
    currentResourceDisplayName?: string
    currentResourceId?: string
}

function getResourceTitle(
    titleOverride?: string,
    displayName?: string,
    resourceId?: string
): string {
    if (titleOverride) {
        return titleOverride
    }
    
    if (displayName) {
        return displayName
    }
    
    const isHomeResource = resourceId?.startsWith('0000')
    return isHomeResource ? 'Home' : 'Packbase'
}

export function useFeedTitle({
    page,
    titleOverride,
    currentResourceDisplayName,
    currentResourceId,
}: UseFeedTitleProps) {
    useEffect(() => {
        const title = getResourceTitle(titleOverride, currentResourceDisplayName, currentResourceId)
        document.title = `${title} • P${page}`
    }, [page, titleOverride, currentResourceDisplayName, currentResourceId])
}
