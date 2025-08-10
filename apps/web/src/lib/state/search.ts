import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SearchStore {
    query: string | null
    setQuery: (query: string | null) => void
}

// UI Settings Store
export const useSearch = create(
    persist<SearchStore>(
        set => ({
            query: null,
            setQuery: query =>
                set(state => ({
                    ...state,
                    query,
                })),
        }),
        {
            name: 'ui-settings',
        }
    )
)
