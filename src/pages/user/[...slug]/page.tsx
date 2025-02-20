'use client'
import {useEffect, useState} from 'react'
import {vg} from '@/lib/api'
import ProfileHeader from '@/components/shared/user/header'
import {LoadingCircle} from '@/components/icons'
import NotFound from '../../not-found'
import Body from '@/components/layout/body'
import FeedList from '@/components/shared/feed/list'

export default function UserProfile({params}: { params: { slug: string } }) {
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        vg.user({username: params.slug})
            .get()
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

            {user && (
                <>
                    {user && <ProfileHeader user={user}/>}

                    <div className="p-8">
                        <FeedList packID={user.id}/>
                    </div>
                </>
            )}
        </>
    )
}
