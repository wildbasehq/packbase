'use client'
import {useEffect, useState} from 'react'
import Body from '@/components/layout/body'
import Link from 'next/link'
import Button from '@/components/shared/button'
import {useUserAccountStore} from '@/lib/states'
import {Heading} from '@/components/shared/text'

export default function Feed() {
    const {user} = useUserAccountStore()
    const [target, setTarget] = useState<any>(null)

    useEffect(() => {
        if (target?.id === user?.id) {
            setTarget(null)
        }
    }, [target, user?.id])

    return (
        <Body>
            <div className="max-w-3xl">
                {!user && (
                    <div
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mb-12 mx-auto justify-center items-center">
                        <div className="flex flex-col space-y-4">
                            <Heading>
                                Below would be better with you in it
                            </Heading>
                            <div className="space-y-2">
                                <p className="text-sm text-alt">
                                    An account is free, and you don't even need an invite code to join. Just sign up,
                                    and
                                    you're good to go. We hope to see you soon!
                                </p>
                            </div>
                            <div className="mt-10 flex items-center gap-x-6">
                                <Link href="/id/create/">
                                    <Button>
                                        Sign up
                                    </Button>
                                </Link>
                                <Link href="/id/login/" className="text-sm font-semibold leading-6 text-default">
                                    Jump back in <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <img src={`/img/illustrations/settings/import-begin.png`} alt="LITTLE BABY BOY"
                                 className="w-auto"/>
                        </div>
                    </div>
                )}
            </div>
        </Body>
    )
}
