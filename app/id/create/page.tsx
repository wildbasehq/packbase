'use client'
import {LoadingCircle} from 'components/icons'
import {Input} from '@/components/shared/input/text'
import {Logo} from '@/components/shared/logo'
import {Heading, Text} from '@/components/shared/text'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/alert'
import {Button} from '@/components/shared/experimental-button-rework'
import {ProjectSafeName} from '@/lib/utils'
import {MailQuestion} from 'lucide-react'
import {FormEvent, useRef, useState} from 'react'
import {supabase} from '@/lib/api'
import Link from '@/components/shared/link'

export default function IDCreate() {
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const password = useRef<HTMLInputElement>()
    const passwordRepeat = useRef<HTMLInputElement>()

    const createUser = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const user = {
            email: formData.get('email')?.toString() || '',
            password: formData.get('password')?.toString() || '',
        }
        supabase.auth.signUp(user).then((r) => {
            if (r.error) {
                setError(r.error.toString())
                setSubmitting(false)
            } else {
                window.location.href = '/'
            }
        })
    }

    // Validates password repeat
    const validatePassword = () => {
        console.log(password.current.value, passwordRepeat.current.value)
        if (password.current.value !== passwordRepeat.current.value) {
            passwordRepeat.current.setCustomValidity('Passwords must match')
        } else {
            passwordRepeat.current.setCustomValidity('')
        }
    }

    return (
        <>
            <div>
                <Logo className="h-12! w-12!"/>
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

                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Sign up failed!</AlertTitle>
                        <AlertDescription>{error.indexOf('server denied the request') > -1 ? 'cancelled!' : error}</AlertDescription>
                    </Alert>
                )}

                <Alert>
                    <AlertTitle>
                        <MailQuestion className="inline-flex h-5 w-5"/> You'll need an invite code
                    </AlertTitle>
                    <AlertDescription>
                        <p>
                            It's required in the next step. Don't have one? If a friend of yours does, they can generate one for you!
                        </p>
                        <p className="text-tertiary">
                            <br/>
                            If you've traded anything for an invite, whether it be an art trade, or even money, you've been scammed.
                        </p>
                    </AlertDescription>
                </Alert>

                <form method="POST" className="space-y-6" onSubmit={createUser}>
                    <div>
                        <Input id="email" type="email" label="Email Address" required/>
                    </div>

                    <div>
                        <label htmlFor="password" className="text-default mb-1 block text-sm font-medium">
                            Password
                            <p className="text-alt text-xs leading-5">at least 6 characters, 1 uppercase, 1 digit, and 1 special character</p>
                        </label>
                        <div className="overflow-visible rounded-md shadow-xs ring-1 ring-neutral-300 dark:ring-white/20">
                            <Input
                                ref={password}
                                combined
                                className="rounded-tl-md rounded-tr-md border-b border-n-3 dark:border-white/20"
                                id="password"
                                label="Password"
                                type="password"
                                placeholder="anything but a name"
                                required
                                onChange={validatePassword}
                            />
                            <Input
                                ref={passwordRepeat}
                                combined
                                className="rounded-bl-md rounded-br-md"
                                id="password-again"
                                label="Password Again"
                                type="password"
                                placeholder="one more time, now"
                                required
                                onChange={validatePassword}
                            />
                        </div>
                    </div>

                    <Link href="/terms" className="flex items-center justify-between">
                        <Text size="xs" className="text-primary">By continuing, you agree to the Packbase Usage Policy & Data Handling terms &rarr;</Text>
                    </Link>

                    <div>
                        <Button
                            color="indigo"
                            type="submit"
                            disabled={submitting}
                            className="flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            {!submitting ? 'Register' : <LoadingCircle/>}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}
