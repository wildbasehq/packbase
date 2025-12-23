/**
 * Container which shows pagination markers specified. Uses HTML queries for control.
 */
import {ReactNode, useEffect, useState} from 'react'
import {
    Pagination,
    PaginationGap,
    PaginationList,
    PaginationNext,
    PaginationPage,
    PaginationPrevious
} from './pagination'
import {useSearchParams} from 'wouter'

export enum PagedContentLoadStatus {
    ERROR,
    SUCCESS,
    NOTHING_LEFT,
}

export interface PagedContainerType {
    // == required ==

    /**
     * Function to call when pagination changes, or when the component initiates
     * @param {number} page
     */
    onNeedsContent: (page: number) => Promise<PagedContentLoadStatus>

    /**
     * The actual content to render
     */
    children: ReactNode

    // == optional ==

    /**
     * Amount of pages to display for Pagination component.
     * Leave this unset if the amount of pages is unknown.
     * @see apps/server/src/routes/search/index.ts
     */
    pages?: number

    /**
     * Component to show when content is loading
     * @optional
     */
    loader?: ReactNode

    /**
     * Whether there's more content to load
     * @optional
     */
    hasMore?: boolean

    /**
     * Message to show if there's no more content. Only shows if there's no pages left
     * and the content on the current page is less than expected.
     *
     * If pages is unset, this will display if onNeedsContent() returns ContentLoadStatus.NOTHING_LEFT.
     * @optional
     */
    endMessage?: ReactNode
}

export default function PagedContainer({
                                           pages,
                                           hasMore,
                                           children,
                                           loader,
                                           endMessage,
                                           onNeedsContent
                                       }: PagedContainerType) {
    const [searchParams, setSearchParams] = useSearchParams()
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1

    // Stores known pages if pages isn't set.
    const [knownPages, setKnownPages] = useState<number[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if ((!!pages && page > pages) || page <= 1) {
            setSearchParams({page: '1'}, {replace: true})
            return
        }
        setLoading(true)
        onNeedsContent(page).then(status => {
            setLoading(false)
            if (status === PagedContentLoadStatus.ERROR) setSearchParams({page: '1'}, {replace: true})
        })

        if (pages) {
            setKnownPages(Array.from({length: pages}, (_, i) => i + 1))
        } else {
            // Pages isn't set, so we'll use any page counts we come across.
            onNeedsContent(page).then(status => {
                if (status === PagedContentLoadStatus.SUCCESS) setKnownPages(prev => [...new Set([...prev, page].sort((a, b) => a - b))])
            })
        }
    }, [page])

    return (
        <div>
            <div className={loading ? 'animate-pulse' : ''}>{children}</div>
            {loading && loader &&
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">{loader}</div>}
            {!hasMore && endMessage &&
                <div className="py-8 text-center text-muted-foreground dark:text-neutral-400">{endMessage}</div>}
            <Pagination>
                {page > 1 && <PaginationPrevious href={`?page=${page - 1}`}/>}
                <PaginationList>
                    {knownPages.length > 6 && (() => {
                        const first = knownPages[0]
                        const last = knownPages[knownPages.length - 1]
                        const current = page
                        const items = []

                        // Always show first page
                        items.push(
                            <PaginationPage
                                href={`?page=${first}`}
                                key={first}
                                current={current === first}
                                onClick={() => setSearchParams({page: first.toString()})}
                            >
                                {first}
                            </PaginationPage>
                        )

                        // Show gap if current page is far from first
                        if (current > 4) {
                            items.push(<PaginationGap key="gap-start"/>)
                        }

                        // Show up to 3 pages before and after current page, but within bounds
                        const start = Math.max(current - 2, first + 1)
                        const end = Math.min(current + 2, last - 1)

                        for (let i = start; i <= end; i++) {
                            items.push(
                                <PaginationPage
                                    href={`?page=${i}`}
                                    key={i}
                                    current={current === i}
                                    onClick={() => setSearchParams({page: i.toString()})}
                                >
                                    {i}
                                </PaginationPage>
                            )
                        }

                        // Show gap if current page is far from last
                        if (current < last - 3) {
                            items.push(<PaginationGap key="gap-end"/>)
                        }

                        // Always show last page
                        if (last !== first) {
                            items.push(
                                <PaginationPage
                                    href={`?page=${last}`}
                                    key={last}
                                    current={current === last}
                                    onClick={() => setSearchParams({page: last.toString()})}
                                >
                                    {last}
                                </PaginationPage>
                            )
                        }

                        return items
                    })()}

                    {(knownPages.length < 6 && knownPages.length > 1) && knownPages.map(i => (
                        <PaginationPage
                            href={`?page=${i}`}
                            key={i}
                            current={page === i}
                            onClick={() => setSearchParams({page: i.toString()})}
                        >
                            {i}
                        </PaginationPage>
                    ))}
                </PaginationList>
                {hasMore && <PaginationNext href={`?page=${page + 1}`}/>}
            </Pagination>
        </div>
    )
}
