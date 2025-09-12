/**
 * Container which shows pagination markers specified. Uses HTML queries for control.
 */
import { ReactNode } from 'react'

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
    onNeedsContent: (page: number) => PagedContentLoadStatus

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
     * Message to show if there's no more content. Only shows if there's no pages left
     * and the content on the current page is less than expected.
     *
     * If pages is unset, this will display if onNeedsContent() returns ContentLoadStatus.NOTHING_LEFT.
     * @optional
     */
    endMessage?: ReactNode
}

export default function PagedContainer({ pages, children, onNeedsContent }: PagedContainerType) {
    return children
}
