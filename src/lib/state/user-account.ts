import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
        set => ({
            accessToken: '',
            user: null,

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
        }),
        {
            name: 'user-account',
        }
    )
)