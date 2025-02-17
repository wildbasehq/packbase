'use client'
import {useEffect} from 'react'
import Body from '@/components/layout/body'
import {settingsResource, useResourceStore, useUIStore, useUserAccountStore} from '@/lib/states'
import {Cog6ToothIcon} from '@heroicons/react/24/solid'
import {useRouter} from 'next/navigation'
import {Heading, Text} from '@/components/shared/text'
import Link from '@/components/shared/link'
import Image from 'next/image'
import WolfoxDrawing from '@/public/img/illustrations/wolfox-drawing.png'
import {Input} from '@/components/shared/input/text'
import {Button} from '@/components/shared/ui/button'
import {vg} from '@/lib/api'
import GridBody from '@/components/layout/grid-body'

export default function Settings({ children }: { children: React.ReactNode }) {
    const { user } = useUserAccountStore()
    const router = useRouter()
    const { setNavigation } = useUIStore()
    const { setCurrentResource } = useResourceStore()

    useEffect(() => {
        setNavigation([
            {
                name: 'General',
                description: '',
                href: '/settings',
                icon: Cog6ToothIcon,
            },
        ])
        setCurrentResource(settingsResource)
    }, [])

    const submitInviteCode = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const post = {
            invite_code: formData.get('invite_code')?.toString() || '',
            username: formData.get('username')?.toString() || '',
        }
        if (!post.invite_code) return alert('Please enter an invite code')
        if (!post.username) return alert('Please enter a username')
        vg.user.me
            .post({
                invite_code: formData.get('invite_code')?.toString() || '',
                username: formData.get('username')?.toString() || '',
            })
            .then(({ status, data, error }) => {
                if (status === 200) window.location.reload()
                else {
                    if (status === 422) {
                        alert('Invalid invite code or unacceptable username!')
                        return
                    }

                    alert(data?.message || data?.error || error.value.summary || JSON.stringify(error) || 'An error occurred')
                }
            })
            .catch((e) => {
                alert(e)
            })
    }

    if (!user) return router.push('/id/login')

    if (user.anonUser)
        return (
            <GridBody className="max-w-6xl sm:grid-cols-2">
                <div className="flex flex-col">
                    <Heading>Got a code?!?</Heading>
                    <div className="mt-2 space-y-2">
                        <Text alt size="sm">
                            If yes, yippee! We're glad you're here. Please enter a valid invite code to get started.{' '}
                            <span className="text-tertiary">
                                If you've traded anything for an invite, whether it be an art trade, or even money, you've been scammed. Report that code instead and work
                                on getting whatever you gave back.
                            </span>
                        </Text>
                        <Text alt size="sm">
                            If you haven't already, please familiarise yourself with our <Link href="/terms">Community & Data Security Guidelines</Link>.
                        </Text>
                    </div>
                    <div className="mt-12 flex flex-col">
                        <form onSubmit={submitInviteCode} className="flex gap-2">
                            <Input name="username" placeholder="Desired username" className="w-full" required />
                            <Input name="invite_code" placeholder="Invite Code" className="w-full" required />
                            <Button>Submit</Button>
                        </form>
                        <Text alt size="sm">
                            Enter the invite code you received.
                        </Text>
                    </div>
                </div>
                <div className="hidden aspect-square items-center lg:flex">
                    <Image src={WolfoxDrawing} alt="LITTLE BABY BOY" className="w-auto" height={3000} width={3000} />
                </div>
            </GridBody>
        )
    return <Body>{children}</Body>
}
