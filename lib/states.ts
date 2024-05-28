import {create} from 'zustand'
import {persist} from 'zustand/middleware'

interface UIStore {
    feedView: number;
    analyticalAllowed: boolean;
    setOptions: (options: object) => void;
}

// UI Settings Store
export const useUIStore = create(persist<UIStore>(
    (set) => ({
        feedView: 1,
        analyticalAllowed: false,

        setOptions: (options) => set((state) => ({
            ...state,
            ...options,
        })),
    }), {
        name: 'ui-settings',
    }
))

/**
 * User Account Store
 * Holds the user's account information, refresh token, etc.
 */
interface UserAccountStore {
    accessToken: string;
    user: any;
    setAccessToken: (accessToken: string) => void;
    setUser: (user: any) => void;
}

export const useUserAccountStore = create(persist<UserAccountStore>(
    (set) => ({
        accessToken: '',
        user: null,

        setAccessToken: (accessToken) => set((state) => ({
            ...state,
            accessToken,
        })),
        setUser: (user: any) => set((state) => ({
            ...state,
            user,
        })),
    }), {
        name: 'user-account',
    }
))

/**
 * Resource store
 */
interface ResourceStore {
    currentResource: any;
    resources: any[];
    setCurrentResource: (currentResource: any) => void;
    setResources: (resources: any[]) => void;
}

const resourceDefault = {
    id: 'p1',
    name: 'Wolfbite Project 1',
    icon: '/logo.png',
    standalone: true,
}

export const useResourceStore = create<ResourceStore>(
    (set) => ({
        currentResource: resourceDefault,
        resources: [],
        setCurrentResource: (currentResource) => set((state) => ({
            ...state,
            currentResource,
        })),
        setResources: (resources) => set((state) => ({
            ...state,
            resources,
        })),
    })
)

/**
 * Resource UI store, not persistent
 */
interface ResourceUIStore {
    resourceDefault: {
        id: string | number;
        name: string;
        icon: string;
        standalone: boolean;
    };
    loading: boolean;
    navigation: any[];
    setLoading: (loading: boolean) => void;
    setNavigation: (navigation: any) => void;
}

export const useResourceUIStore = create<ResourceUIStore>(
    (set) => ({
        resourceDefault,
        loading: true,
        navigation: [],
        setLoading: (loading) => set((state) => ({
            ...state,
            loading,
        })),
        setNavigation: (navigation: any) => set((state) => ({
            ...state,
            navigation,
        })),
    })
)
