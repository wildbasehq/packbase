import {create} from 'zustand'
import {persist} from 'zustand/middleware'

/**
 * User Account Store
 * Holds the user's account information, refresh token, etc.
 */
interface UserAccountStore {
    accessToken: string
    user: any
    settings: any
    setAccessToken: (accessToken: string) => void
    setUser: (user: any) => void
    setSettings: (settings: any) => void
}

export const useUserAccountStore = create(
    persist<UserAccountStore>(
        set => ({
            accessToken: '',
            user: null,
            settings: null,

            setAccessToken: accessToken =>
                set(state => ({
                    ...state,
                    accessToken,
                })),
            setUser: (user: any) =>
                set(state => ({
                    ...state,
                    user,
                })),
            setSettings: (settings: any) =>
                set(state => ({
                    ...state,
                    settings,
                })),
        }),
        {
            name: 'user-account',
        }
    )
)