import {create} from 'zustand'
import {resourceDefault} from '@/src/lib'

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
    maintenance: string | null
    websocketStatus: string
    serverCapabilities: string[]

    setHidden: (hidden: boolean) => void
    setLoading: (loading: boolean) => void
    setConnecting: (connecting: boolean) => void
    setNavigation: (navigation: any) => void
    setBucketRoot: (bucketRoot: string) => void
    setMaintenance: (maintenance: string | null) => void
    setWebsocketStatus: (status: string) => void
    setServerCapabilities: (capabilities: string[]) => void

    updateAvailable: string | false
    setUpdateAvailable: (update: string | false) => void
}

export const useUIStore = create<ResourceUIStore>(set => ({
    resourceDefault,
    hidden: false,
    loading: true,
    connecting: true,
    navigation: [],
    bucketRoot: '',
    maintenance: null,
    updateAvailable: false,
    websocketStatus: 'connecting',
    serverCapabilities: ['realtime'],
    setHidden: hidden =>
        set(state => ({
            ...state,
            hidden,
        })),
    setLoading: loading =>
        set(state => ({
            ...state,
            loading,
        })),
    setConnecting: connecting =>
        set(state => ({
            ...state,
            connecting,
        })),
    setNavigation: (navigation: any) =>
        set(state => ({
            ...state,
            navigation,
            hidden: false,
        })),
    setBucketRoot: (bucketRoot: string) =>
        set(state => ({
            ...state,
            bucketRoot,
        })),
    setMaintenance: (maintenance: string | null) =>
        set(state => ({
            ...state,
            maintenance,
        })),
    setWebsocketStatus: (status: string) =>
        set(state => ({
            ...state,
            websocketStatus: status,
        })),

    setUpdateAvailable: update =>
        set(state => ({
            ...state,
            updateAvailable: update,
        })),
    setServerCapabilities: capabilities =>
        set(state => ({
            ...state,
            serverCapabilities: capabilities,
        })),
}))
