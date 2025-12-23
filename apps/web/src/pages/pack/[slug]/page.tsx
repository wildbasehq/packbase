import GuestLanding from '@/components/home/guestlanding'
import {useUIStore, useUserAccountStore} from '@/lib/state'
import {useEffect} from 'react'
import PackFeedController from '../../pack/components'

export default function PackHome() {
    const {user} = useUserAccountStore()
    const {setHidden} = useUIStore()

    useEffect(() => {
        if (!user || user?.anonUser) setHidden(true)
    }, [user])

    if (!user) return <GuestLanding/>
    return <PackFeedController/>
}
