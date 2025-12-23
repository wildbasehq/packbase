/**
 * Container which shows pagination markers specified. Uses HTML queries for control.
 */
import {ReactNode, useEffect, useState} from 'react'
import {useSearchParams} from 'wouter'
import {Pagination, PaginationGap, PaginationList, PaginationNext, PaginationPage, PaginationPrevious} from './pagination'

export enum PagedContentLoadStatus {
    ERROR,
    SUCCESS,
    NOTHING_LEFT,
}

export interface PagedContainerType {
    // == required ==

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
                                           endMessage
                                       }: PagedContainerType) {
    const [searchParams, setSearchParams] = useSearchParams()
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1

    // Stores known pages if pages isn't set.
    const [knownPages, setKnownPages] = useState<number[]>([])

    useEffect(() => {
        if (!!pages && page > pages) {
            setSearchParams({page: '1'}, {replace: true})
            return
        }

        if (pages) {
            setKnownPages(Array.from({length: pages}, (_, i) => i + 1))
        } else {
            setKnownPages(prev => [...new Set([...prev, page].sort((a, b) => a - b))])
        }
    }, [page])

    return (
        <div className="space-y-8">
            <PaginationActions
                page={page}
                setSearchParams={setSearchParams}
                pages={knownPages}
                hasMore={hasMore}
            />

            {children}

            {!hasMore && endMessage && (
                endMessage
            )}

            <PaginationActions
                page={page}
                setSearchParams={setSearchParams}
                pages={knownPages}
                hasMore={hasMore}
            />
        </div>
    )
}

function PaginationActions({
                               page,
                               setSearchParams,
                               pages,
                               hasMore,
                           }: {
    page: number
    setSearchParams: (params: Record<string, string>) => void
    pages?: number[]
    hasMore?: boolean
}) {
    return (
        <Pagination>
            {page > 1 && <PaginationPrevious href={`?page=${page - 1}`}/>}
            <PaginationList>
                {pages.length > 6 && (() => {
                    const first = pages[0]
                    const last = pages[pages.length - 1]
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

                {(pages.length < 6 && pages.length > 1) && pages.map(i => (
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
    )
}
