import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ProjectSafeName } from '@/lib/utils'

interface UIStore {
    feedView: number
    analyticalAllowed: boolean
    setOptions: (options: object) => void
}

// UI Settings Store
export const useUISettingsStore = create(
    persist<UIStore>(
        (set) => ({
            feedView: 1,
            analyticalAllowed: false,

            setOptions: (options) =>
                set((state) => ({
                    ...state,
                    ...options,
                })),
        }),
        {
            name: 'ui-settings',
        },
    ),
)

/**
 * User Account Store
 * Holds the user's account information, refresh token, etc.
 */
interface UserAccountStore {
    accessToken: string
    user: any
    setAccessToken: (accessToken: string) => void
    setUser: (user: any) => void
}

export const useUserAccountStore = create(
    persist<UserAccountStore>(
        (set) => ({
            accessToken: '',
            user: null,

            setAccessToken: (accessToken) =>
                set((state) => ({
                    ...state,
                    accessToken,
                })),
            setUser: (user: any) =>
                set((state) => ({
                    ...state,
                    user,
                })),
        }),
        {
            name: 'user-account',
        },
    ),
)

/**
 * Resource store
 */
interface ResourceStore {
    currentResource: any
    resources: any[]
    setCurrentResource: (currentResource: any) => void
    setResources: (resources: any[]) => void
}

const resourceDefault = {
    id: 'universe',
    slug: 'universe',
    display_name: ProjectSafeName,
    standalone: true,
}

export const useResourceStore = create<ResourceStore>((set) => ({
    currentResource: resourceDefault,
    resources: [],
    setCurrentResource: (currentResource) =>
        set((state) => ({
            ...state,
            currentResource,
        })),
    setResources: (resources) =>
        set((state) => ({
            ...state,
            resources,
        })),
}))

export const settingsResource = {
    id: 'settings',
    display_name: 'Configure',
    icon: '/svg/settings.svg',
    standalone: true,
}

/**
 * Resource UI store, not persistent
 */
interface ResourceUIStore {
    resourceDefault: {
        id: string | number
        display_name: string
        icon?: string
        standalone: boolean
    }
    hidden: boolean
    loading: boolean
    connecting: boolean
    navigation: any[]
    bucketRoot: string
    setHidden: (hidden: boolean) => void
    setLoading: (loading: boolean) => void
    setConnecting: (connecting: boolean) => void
    setNavigation: (navigation: any) => void
    setBucketRoot: (bucketRoot: string) => void
}

export const useUIStore = create<ResourceUIStore>((set) => ({
    resourceDefault,
    hidden: false,
    loading: true,
    connecting: true,
    navigation: [],
    bucketRoot: '',
    setHidden: (hidden) =>
        set((state) => ({
            ...state,
            hidden,
        })),
    setLoading: (loading) =>
        set((state) => ({
            ...state,
            loading,
        })),
    setConnecting: (connecting) =>
        set((state) => ({
            ...state,
            connecting,
        })),
    setNavigation: (navigation: any) =>
        set((state) => ({
            ...state,
            navigation,
            hidden: false,
        })),
    setBucketRoot: (bucketRoot: string) =>
        set((state) => ({
            ...state,
            bucketRoot,
        })),
}))
