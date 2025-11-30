import {create} from 'zustand'

/**
 * Resource store
 */
interface ResourceStore {
    currentResource: any
    resourceDefault: any
    resources: any[]
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
        'Universe pack deletion soon'
    ]
}

export const useResourceStore = create<ResourceStore>(set => ({
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
}))

export const settingsResource = {
    id: 'settings',
    display_name: 'Configure',
    standalone: true,
}

// Export the resourceDefault for use in other stores
export {resourceDefault}