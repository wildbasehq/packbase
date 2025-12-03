import {create} from 'zustand'
import {persist} from "zustand/middleware";

/**
 * Resource store
 */
interface ResourceStore {
    currentResource: any
    resourceDefault: any
    resources: {
        display_name: string,
        slug: string,
        id: string,
        standalone: boolean,
        ticker?: string[],
        images?: {
            avatar?: string,
            header?: string,
        }
    }[]
    setResourceDefault: (resourceDefault: any) => void
    setCurrentResource: (currentResource: any) => void
    setResources: (resources: any[]) => void
}

const resourceDefault = {
    id: '00000000-0000-0000-0000-000000000000',
    slug: 'universe',
    display_name: 'Packbase',
    standalone: true,
    ticker: [
        'Now in public alpha testing!',
        'Invite Badge Event extended',
        'Universe pack deletion',
        'R18 content allowed'
    ]
}

export const useResourceStore = create(persist<ResourceStore>(set => ({
    currentResource: resourceDefault,
    resources: [],
    resourceDefault,
    setResourceDefault: resourceDefault =>
        set(state => ({
            ...state,
            resourceDefault,
        })),
    setCurrentResource: currentResource =>
        set(state => ({
            ...state,
            currentResource,
        })),
    setResources: resources =>
        set(state => ({
            ...state,
            resources,
        })),
}), {
    name: 'resource',
}))

export const settingsResource = {
    id: 'settings',
    display_name: 'Configure',
    standalone: true,
}

// Export the resourceDefault for use in other stores
export {resourceDefault}