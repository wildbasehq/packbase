import {useUserAccountStore} from '@/lib'
import {vg} from '@/lib/api'
import {PackThemeAPI} from '@/src/lib/api/packs/theme'
import {Theme} from '@/src/lib/api/users/theme'
import {useEffect, useState} from 'react'

// Component to render custom theme HTML and CSS for users or packs
interface CustomThemeProps {
    userId?: string
    packId?: string
}

export function CustomTheme({userId, packId}: CustomThemeProps) {
    const [theme, setTheme] = useState<Theme | null>(null)
    const {settings} = useUserAccountStore()
    const loadTheme = settings.ask_load_themes

    useEffect(() => {
        if (userId && !packId) {
            // Fetch user theme
            vg.user({username: userId})
                .theme.get()
                .then(({data}) => {
                    if (data && !data.message) {
                        if (loadTheme === 'never') {
                            setTheme(null)
                            return
                        }

                        if (loadTheme === 'ask') {
                            const consent = window.confirm(`This ${userId ? 'profile' : ''}${packId ? 'Pack' : ''} wants to load custom HTML and CSS. Do you allow this? You can change this later in settings.`)
                            if (!consent) {
                                setTheme(null)
                                return
                            }
                        }

                        setTheme(data)
                    } else setTheme(null)
                })
                .catch(e => {
                    console.error('Error fetching user theme:', e)
                    setTheme(null)
                })
        } else if (packId && !userId) {
            // Fetch pack theme
            PackThemeAPI.getActive(packId)
                .then(data => {
                    if (data) {
                        if (loadTheme === 'never') {
                            setTheme(null)
                            return
                        }

                        if (loadTheme === 'ask') {
                            const consent = window.confirm(`This ${userId ? 'profile' : ''}${packId ? 'Pack' : ''} wants to load custom HTML and CSS. Do you allow this? You can change this later in settings.`)
                            if (!consent) {
                                setTheme(null)
                                return
                            }
                        }

                        setTheme(data)
                    } else setTheme(null)
                })
                .catch(e => {
                    console.error('Error fetching pack theme:', e)
                    setTheme(null)
                })
        }
    }, [userId, packId, loadTheme])

    if (!theme) return null

    // Combine CSS and HTML for rendering
    const combinedTheme = `
        <style>${theme.css}</style>
        ${theme.html}
    `

    return (
        <div className="custom-theme-container">
            <div dangerouslySetInnerHTML={{__html: combinedTheme}}/>
        </div>
    )
}
