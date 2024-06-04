'use client'
import {useEffect, useState} from 'react'
import {FetchHandler} from '@/lib/api'
import ProfileHeader from '@/components/shared/user/header'
import {LoadingCircle} from '@/components/shared/icons'
import NotFound from '@/app/not-found'
import Body from '@/components/layout/body'

export default function UserProfile({params}: { params: { slug: string } }) {
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        FetchHandler.get(`/users/@${params.slug}`)
            .then(({data}) => {
                if (!data || data.message) return setError('failed')
                setLoading(false)
                setUser(data)
            })
            .catch((e) => {
                setError(e)
            })
    }, [])

    if (error) return <NotFound/>

    return (
        <>
            {loading && (
                <Body>
                    <div className="mx-auto">
                        <LoadingCircle/>
                    </div>
                </Body>
            )}
            {(!loading && user) && <ProfileHeader user={user}/>}
        </>
    )
}