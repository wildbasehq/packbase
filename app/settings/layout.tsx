'use client'
import {useEffect} from 'react'
import Body from '@/components/layout/body'
import {useResourceUIStore, useUserAccountStore} from '@/lib/states'
import {Cog6ToothIcon} from '@heroicons/react/24/solid'

export default function Settings({children}: {
    children: React.ReactNode
}) {
    const {user} = useUserAccountStore()
    const {setNavigation} = useResourceUIStore()
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
