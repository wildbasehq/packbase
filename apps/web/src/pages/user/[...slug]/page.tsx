/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useEffect, useState} from 'react'
import {vg} from '@/lib/api'
import ProfileHeader from '@/components/shared/user/header'
import {LoadingCircle} from '@/components/icons'
import NotFound from '@/src/not-found'
import Body from '@/components/layout/body'
import {useParams} from 'wouter'
import {Feed} from '@/components/feed'
import {CustomTheme} from '@/components/shared/theme/custom-theme'
import {useUserAccountStore} from '@/lib'
import {SafeFrame} from '@/components/shared'

export default function UserProfile() {
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const {slug} = useParams<{ slug: string }>()
    const {user: selfUser} = useUserAccountStore()

    useEffect(() => {
        setLoading(true)
        setError(null)
        setUser(null)

        vg.user({username: slug.split('/')[0] === 'me' ? selfUser.username : slug.split('/')[0]})
            .get()
            .then(({data}) => {
                if (!data || data.message) {
                    setError('failed')
                } else setUser(data)

                setLoading(false)
            })
            .catch(e => {
                setError(e)
            })
    }, [slug])

    if (error) return <NotFound/>

    return (
        <SafeFrame className="w-full h-full">
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

                    <CustomTheme userId={user.id}/>

                    <div className="p-8" id="profile-feed">
                        <Feed packID={user.id}/>
                    </div>
                </>
            )}
        </SafeFrame>
    )
}
