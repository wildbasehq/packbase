import {create} from 'zustand'
import {persist} from "zustand/middleware";

type Resource = {
    verified?: boolean;
    display_name: string,
    slug: string,
    id: string,
    standalone: boolean,
    ticker?: string[],
    images?: {
        avatar?: string,
        header?: string,
    }
    membership?: {
        permissions?: number
    }

    // If user isn't a member
    temporary?: boolean,
}

/**
 * Resource store
 */
interface ResourceStore {
    currentResource: Resource
    resourceDefault: any
    resources: Resource[]
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
        set(state => {
            if (!Array.isArray(resources)) return {...state, resources}
            const currentId = state.resourceDefault?.id
            if (!currentId) return {...state, resources}
            const idx = resources.findIndex(r => r.id === currentId)
            if (idx <= 0) return {...state, resources}
            const prioritized = [resources[idx], ...resources.slice(0, idx), ...resources.slice(idx + 1)]
            return {
                ...state,
                resources: prioritized,
            }
        }),
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