import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/api'
import { Theme } from '@/lib/api/theme.ts'

// Pack theme API service
export const PackThemeAPI = {
    // Get active theme for a pack
    async getActive(packId: string): Promise<Theme | null> {
        try {
            const response = await fetch(`${API_URL}/pack/${packId}/theme`, {
                headers: {
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
            })
            if (!response.ok) {
                if (response.status === 404) {
                    return null // No active theme
                }
                throw new Error('Failed to fetch pack theme')
            }
            return await response.json()
        } catch (error) {
            console.error('Error fetching pack theme:', error)
            return null
        }
    },

    // Get all themes for a pack (owner only)
    async getAll(packId: string): Promise<Theme[]> {
        try {
            const response = await fetch(`${API_URL}/pack/${packId}/themes`, {
                headers: {
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
            })
            if (!response.ok) {
                throw new Error('Failed to fetch pack themes')
            }
            return await response.json()
        } catch (error) {
            console.error('Error fetching pack themes:', error)
            return []
        }
    },

    // Create a new pack theme (owner only)
    async create(packId: string, theme: Omit<Theme, 'id' | 'pack_id' | 'created_at' | 'updated_at'>): Promise<Theme | null> {
        try {
            const response = await fetch(`${API_URL}/pack/${packId}/themes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
                body: JSON.stringify({ ...theme, pack_id: packId }),
            })
            if (!response.ok) {
                throw new Error('Failed to create pack theme')
            }
            return await response.json()
        } catch (error) {
            console.error('Error creating pack theme:', error)
            return null
        }
    },

    // Update an existing pack theme (owner only)
    async update(
        packId: string,
        themeId: string,
        theme: Partial<Omit<Theme, 'id' | 'pack_id' | 'created_at' | 'updated_at'>>
    ): Promise<Theme | null> {
        try {
            const response = await fetch(`${API_URL}/pack/${packId}/themes/${themeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
                body: JSON.stringify(theme),
            })
            if (!response.ok) {
                throw new Error('Failed to update pack theme')
            }
            return await response.json()
        } catch (error) {
            console.error('Error updating pack theme:', error)
            return null
        }
    },

    // Delete a pack theme (owner only)
    async delete(packId: string, themeId: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/pack/${packId}/themes/${themeId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
            })
            if (!response.ok) {
                throw new Error('Failed to delete pack theme')
            }
            return true
        } catch (error) {
            console.error('Error deleting pack theme:', error)
            return false
        }
    },

    // Validate pack theme content (owner only)
    async validate(
        packId: string,
        html: string,
        css: string
    ): Promise<{ valid: boolean; sanitized: { html: string; css: string } } | null> {
        try {
            const response = await fetch(`${API_URL}/pack/${packId}/themes/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
                body: JSON.stringify({ html, css }),
            })
            if (!response.ok) {
                throw new Error('Failed to validate pack theme')
            }
            return await response.json()
        } catch (error) {
            console.error('Error validating pack theme:', error)
            return null
        }
    },
}

// Custom hook for managing pack themes (owner only)
export function usePackThemes(packId: string) {
    const [themes, setThemes] = useState<Theme[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch themes on mount
    useEffect(() => {
        if (!packId) return

        const fetchThemes = async () => {
            try {
                setLoading(true)
                const data = await PackThemeAPI.getAll(packId)
                setThemes(data)
                setError(null)
            } catch (err) {
                setError('Failed to fetch pack themes')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchThemes()
    }, [packId])

    // Add a new theme
    const addTheme = async (theme: Omit<Theme, 'id' | 'pack_id' | 'created_at' | 'updated_at'>) => {
        const newTheme = await PackThemeAPI.create(packId, theme)
        if (newTheme) {
            // If the new theme is active, deactivate all others
            if (newTheme.is_active) {
                setThemes(prev => prev.map(t => ({ ...t, is_active: t.id === newTheme.id })))
            } else {
                setThemes(prev => [...prev, newTheme])
            }
            return newTheme
        }
        return null
    }

    // Update an existing theme
    const updateTheme = async (themeId: string, theme: Partial<Omit<Theme, 'id' | 'pack_id' | 'created_at' | 'updated_at'>>) => {
        const updatedTheme = await PackThemeAPI.update(packId, themeId, theme)
        if (updatedTheme) {
            // If the updated theme is active, deactivate all others
            if (updatedTheme.is_active) {
                setThemes(prev => prev.map(t => ({ ...t, is_active: t.id === updatedTheme.id })))
            } else {
                setThemes(prev => prev.map(t => (t.id === themeId ? updatedTheme : t)))
            }
            return updatedTheme
        }
        return null
    }

    // Delete a theme
    const deleteTheme = async (themeId: string) => {
        const success = await PackThemeAPI.delete(packId, themeId)
        if (success) {
            setThemes(prev => prev.filter(t => t.id !== themeId))
        }
        return success
    }

    return {
        themes,
        loading,
        error,
        addTheme,
        updateTheme,
        deleteTheme,
    }
}

// Hook for getting active pack theme (public access)
export function usePackTheme(packId: string) {
    const [theme, setTheme] = useState<Theme | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!packId) return

        const fetchTheme = async () => {
            try {
                setLoading(true)
                const data = await PackThemeAPI.getActive(packId)
                setTheme(data)
                setError(null)
            } catch (err) {
                setError('Failed to fetch pack theme')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchTheme()
    }, [packId])

    return {
        theme,
        loading,
        error,
        refresh: () => {
            PackThemeAPI.getActive(packId).then(setTheme)
        },
    }
}
