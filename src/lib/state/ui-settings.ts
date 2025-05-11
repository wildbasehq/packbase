import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
    feedView: number
    analyticalAllowed: boolean
    setOptions: (options: object) => void
}

// UI Settings Store
export const useUISettingsStore = create(
    persist<UIStore>(
        set => ({
            feedView: 1,
            analyticalAllowed: false,

            setOptions: options =>
                set(state => ({
                    ...state,
                    ...options,
                })),
        }),
        {
            name: 'ui-settings',
        }
    )
)