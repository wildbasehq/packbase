import {useEffect, useState} from 'react'
import {vg} from '@/lib/api'
import ProfileHeader from '@/components/shared/user/header'
import {LoadingCircle} from '@/components/icons'
import NotFound from '@/src/not-found'
import Body from '@/components/layout/body'
import FeedList from '@/components/shared/feed/list'
import {useParams} from 'wouter'

export default function UserProfile() {
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const {slug} = useParams<{ slug: string }>()

    useEffect(() => {
        setLoading(true)
        setError(null)
        setUser(null)

        vg.user({username: slug.split('/')[0]})
            .get()
            .then(({data}) => {
                if (!data || data.message) return setError('failed')
                setLoading(false)
                setUser(data)
            })
            .catch((e) => {
                setError(e)
            })
    }, [slug])

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
                    <ProfileHeader user={user}/>

                    <div className="p-8">
                        <FeedList key={user} packID={user.id}/>
                    </div>
                </>
            )}
        </>
    )
}
