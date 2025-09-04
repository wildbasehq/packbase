import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/api'

// Theme model based on the API documentation
export interface Theme {
    id?: string
    name: string
    html: string
    css: string
    is_active?: boolean
    pack_id?: string
    user_id?: string
    created_at?: string
    updated_at?: string
}

// Validation result from the API
export interface ValidationResult {
    isValid: boolean
    html: string
    css: string
    htmlIssue?: string
    cssIssue?: string
}

// Theme API service
export const ThemeAPI = {
    // Get all themes
    async getAll(): Promise<Theme[]> {
        try {
            const response = await fetch(`${API_URL}/themes`, {
                headers: {
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
            })
            if (!response.ok) {
                throw new Error('Failed to fetch themes')
            }
            return await response.json()
        } catch (error) {
            console.error('Error fetching themes:', error)
            return []
        }
    },

    // Create a new theme
    async create(theme: Theme): Promise<Theme | null> {
        try {
            const response = await fetch(`${API_URL}/themes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
                body: JSON.stringify(theme),
            })
            if (!response.ok) {
                throw new Error('Failed to create theme')
            }
            return await response.json()
        } catch (error) {
            console.error('Error creating theme:', error)
            return null
        }
    },

    // Update an existing theme
    async update(id: string, theme: Partial<Theme>): Promise<Theme | null> {
        try {
            const response = await fetch(`${API_URL}/themes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
                body: JSON.stringify(theme),
            })
            if (!response.ok) {
                throw new Error('Failed to update theme')
            }
            return await response.json()
        } catch (error) {
            console.error('Error updating theme:', error)
            return null
        }
    },

    // Delete a theme
    async delete(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/themes/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
            })
            if (!response.ok) {
                throw new Error('Failed to delete theme')
            }
            return true
        } catch (error) {
            console.error('Error deleting theme:', error)
            return false
        }
    },

    // Validate theme content
    async validate(html: string, css: string): Promise<ValidationResult | null> {
        try {
            const response = await fetch(`${API_URL}/themes/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${globalThis.TOKEN || ''}`,
                },
                body: JSON.stringify({ html, css }),
            })
            if (!response.ok) {
                throw new Error('Failed to validate theme')
            }
            return await response.json()
        } catch (error) {
            console.error('Error validating theme:', error)
            return null
        }
    },
}

// Custom hook for managing themes
export function useThemes() {
    const [themes, setThemes] = useState<Theme[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch themes on mount
    useEffect(() => {
        const fetchThemes = async () => {
            try {
                setLoading(true)
                const data = await ThemeAPI.getAll()
                setThemes(data)
                setError(null)
            } catch (err) {
                setError('Failed to fetch themes')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchThemes()
    }, [])

    // Add a new theme
    const addTheme = async (theme: Theme) => {
        const newTheme = await ThemeAPI.create(theme)
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
    const updateTheme = async (id: string, theme: Partial<Theme>) => {
        const updatedTheme = await ThemeAPI.update(id, theme)
        if (updatedTheme) {
            // If the updated theme is active, deactivate all others
            if (updatedTheme.is_active) {
                setThemes(prev => prev.map(t => ({ ...t, is_active: t.id === updatedTheme.id })))
            } else {
                setThemes(prev => prev.map(t => (t.id === id ? updatedTheme : t)))
            }
            return updatedTheme
        }
        return null
    }

    // Delete a theme
    const deleteTheme = async (id: string) => {
        const success = await ThemeAPI.delete(id)
        if (success) {
            setThemes(prev => prev.filter(t => t.id !== id))
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
