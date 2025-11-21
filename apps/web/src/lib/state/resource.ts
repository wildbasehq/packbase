import {create} from 'zustand'

/**
 * Resource store
 */
interface ResourceStore {
    currentResource: any
    resourceDefault: any
    resources: any[]
    setCurrentResource: (currentResource: any) => void
    setResources: (resources: any[]) => void
}

const resourceDefault = {
    id: '00000000-0000-0000-0000-000000000000',
    slug: 'universe',
    display_name: 'Packbase',
    standalone: true,
}

export const useResourceStore = create<ResourceStore>(set => ({
    currentResource: resourceDefault,
    resources: [],
    resourceDefault,
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
export { resourceDefault }