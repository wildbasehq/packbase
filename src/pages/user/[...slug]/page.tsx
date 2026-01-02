import { useEffect, useState } from 'react'
import { vg } from '@/lib/api'
import ProfileHeader from '@/components/shared/user/header'
import { LoadingCircle } from '@/components/icons'
import NotFound from '@/src/not-found'
import Body from '@/components/layout/body'
import { useParams } from 'wouter'
import { Feed } from '@/components/feed'
import { Theme } from '@/lib/api/theme'

// Component to render custom theme HTML and CSS
interface CustomThemeProps {
    userId: string
}

function CustomTheme({ userId }: CustomThemeProps) {
    const [theme, setTheme] = useState<Theme | null>(null)

    useEffect(() => {
        vg.user({ username: userId })
            .theme.get()
            .then(({ data }) => {
                if (!data || data.message) return setTheme(null)
                setTheme(data)
            })
            .catch(e => {
                console.error('Error fetching theme:', e)
                setTheme(null)
            })
    }, [userId])

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

export default function UserProfile() {
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const { slug } = useParams<{ slug: string }>()

    useEffect(() => {
        setLoading(true)
        setError(null)
        setUser(null)

        vg.user({ username: slug.split('/')[0] })
            .get()
            .then(({ data }) => {
                if (!data || data.message) return setError('failed')
                setLoading(false)
                setUser(data)
            })
            .catch(e => {
                setError(e)
            })
    }, [slug])

    if (error) return <NotFound />

    return (
        <>
            {loading && (
                <Body>
                    <div className="mx-auto">
                        <LoadingCircle />
                    </div>
                </Body>
            )}

            {user && (
                <>
                    <ProfileHeader user={user} />

                    {/* Custom theme code here */}
                    <CustomTheme userId={user.id} />

                    <div className="p-8" id="profile-feed">
                        <Feed packID={user.id} />
                    </div>
                </>
            )}
        </>
    )
}
