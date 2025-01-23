'use client'
import Link from 'next/link'
import { Button } from '@/components/shared/ui/button'
import { Heading, Text } from '@/components/shared/text'
import { ProjectSafeName } from '@/lib/utils'
import { Input } from '@/components/shared/input/text'
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/ui/alert'
import { MailQuestion } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FormEvent, useState } from 'react'
import { Logo } from '@/components/shared/logo'
import { LoadingCircle } from '@/components/shared/icons'

export default function IDCreate({ searchParams }: { searchParams: { error_description: string; error: string } }) {
    const [submitting, setSubmitting] = useState(false)
    switch (searchParams?.error_description) {
        case 'The resource owner or authorization server denied the request': {
            searchParams.error_description = 'Login cancelled'
        }
    }

    const createUser = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const user = {
            email: formData.get('email')?.toString() || '',
            password: formData.get('password')?.toString() || '',
        }
        const supabase = createClient()
        supabase.auth.signUp(user).then((r) => {
            if (r.error) {
                window.location.href = `/id/create?error=Serverland Error&error_description=${r.error.toString()}`
            } else {
                window.location.href = '/settings'
            }
        })
    }

    return (
        <>
            <div>
                <Logo className="!h-12 !w-12" />
                <Heading className="mt-6" size="2xl" as="h2">
                    Create a new account
                </Heading>
                <p className="mt-2 text-sm text-gray-600">
                    Or{' '}
                    <Link href="/id/login" className="font-medium">
                        login to an existing one
                    </Link>
                </p>
            </div>

            <div className="mt-8 space-y-8">
                {process.env.NEXT_PUBLIC_REGISTRATION_CLOSE && (
                    <div className="flex flex-col space-y-2 text-center">
                        <Heading size="2xl" className="text-2xl">
                            Registration is closed.
                        </Heading>
                        <Text>{ProjectSafeName} is not open for public registration.</Text>
                    </div>
                )}

                {searchParams?.error_description && (
                    <Alert variant="destructive">
                        <AlertTitle>{searchParams.error}</AlertTitle>
                        <AlertDescription>{searchParams.error_description}</AlertDescription>
                    </Alert>
                )}

                <Alert>
                    <AlertTitle>
                        <MailQuestion className="inline-flex h-5 w-5" /> You'll need an invite code
                    </AlertTitle>
                    <AlertDescription>
                        <p>
                            It's required in the next step. Don't have one? Generous users who have access can see a list of users without an invite (like you) and gift
                            one to them!~
                        </p>
                        <p className="text-tertiary">
                            <br />
                            If you've traded anything for an invite, whether it be an art trade, or even money, you've been scammed.
                        </p>
                    </AlertDescription>
                </Alert>

                <form method="POST" className="space-y-6" onSubmit={createUser}>
                    <div>
                        <Input id="email" type="email" label="Email Address" required />
                    </div>

                    <div>
                        <label htmlFor="password" className="text-default mb-1 block text-sm font-medium">
                            Password
                            <p className="text-alt text-xs leading-5">at least 8 characters, 1 uppercase, 1 special character</p>
                        </label>
                        <div className="overflow-visible rounded-md shadow-sm ring-1 ring-neutral-300 dark:ring-white/20">
                            <Input
                                combined
                                className="rounded-tl-md rounded-tr-md border-b border-n-3 dark:border-white/20"
                                id="password"
                                label="Password"
                                type="password"
                                placeholder="anything but a name"
                                required
                            />
                            <Input
                                combined
                                className="rounded-bl-md rounded-br-md"
                                id="password-again"
                                label="Password Again"
                                type="password"
                                placeholder="one more time, now"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Text size="xs">By continuing, you agree to our terms and privacy policy.</Text>
                    </div>

                    <div>
                        <Button
                            variant="default"
                            type="submit"
                            disabled={submitting}
                            className="flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            {!submitting ? 'Register' : <LoadingCircle />}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}
