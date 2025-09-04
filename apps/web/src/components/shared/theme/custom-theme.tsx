import { useEffect, useState } from 'react'
import { vg } from '@/lib/api'
import { Theme } from '@/lib/api/theme'
import { PackThemeAPI } from '@/lib/api/pack-theme'

// Component to render custom theme HTML and CSS for users or packs
interface CustomThemeProps {
    userId?: string
    packId?: string
}

export function CustomTheme({ userId, packId }: CustomThemeProps) {
    const [theme, setTheme] = useState<Theme | null>(null)

    useEffect(() => {
        if (userId && !packId) {
            // Fetch user theme
            vg.user({ username: userId })
                .theme.get()
                .then(({ data }) => {
                    if (!data || data.message) return setTheme(null)
                    setTheme(data)
                })
                .catch(e => {
                    console.error('Error fetching user theme:', e)
                    setTheme(null)
                })
        } else if (packId && !userId) {
            // Fetch pack theme
            PackThemeAPI.getActive(packId)
                .then(data => {
                    if (!data) return setTheme(null)
                    setTheme(data)
                })
                .catch(e => {
                    console.error('Error fetching pack theme:', e)
                    setTheme(null)
                })
        }
    }, [userId, packId])

    if (!theme) return null

    // Combine CSS and HTML for rendering
    const combinedTheme = `
        <style>${theme.css}</style>
        ${theme.html}
    `

    return (
        <div className="custom-theme-container">
            <div dangerouslySetInnerHTML={{ __html: combinedTheme }} />
        </div>
    )
}
