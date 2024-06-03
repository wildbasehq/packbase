'use client'
import {useEffect} from 'react'
import Body from '@/components/layout/body'
import {useResourceUIStore, useUserAccountStore} from '@/lib/states'
import {Cog6ToothIcon} from '@heroicons/react/24/solid'
import {useRouter} from 'next/navigation'

export default function Settings({children}: {
    children: React.ReactNode
}) {
    const {user} = useUserAccountStore()
    const router = useRouter()
    const {setNavigation} = useResourceUIStore()

    if (!user) return router.push('/id/login')
    useEffect(() => {
        setNavigation([{
            name: 'General',
            description: '',
            href: '/settings',
            icon: Cog6ToothIcon,
        }])
    }, [])

    return (
        <Body>
            {children}
        </Body>
    )
}
