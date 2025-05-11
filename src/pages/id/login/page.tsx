import {FormEvent, useState} from 'react'
import {Logo} from '@/components/shared/logo'
import {Heading} from '@/components/shared/text'
import {Input} from '@/components/shared/input/text'
import {Button} from '@/components/shared/experimental-button-rework'
import {LoadingCircle} from '@/components/icons'
import {useUserAccountStore} from '@/lib/state'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/alert'
import {supabase} from '@/lib/api'
import Link from '@/components/shared/link'
import {useSearchParams} from 'wouter'

export default function IDLogin() {
    const {user} = useUserAccountStore()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [searchParams] = useSearchParams()

    if (user) return (window.location.href = '/')

    const loginUser = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const user = {
            email: formData.get('email')?.toString() || '',
            password: formData.get('password')?.toString() || '',
        }
        supabase.auth
            .signInWithPassword(user)
            .then((r) => {
                if (r.error) {
                    setSubmitting(false)
                    setError(r.error.toString())
                } else {
                    window.location.href = searchParams.get('redirect') || '/'
                }
            })
            .catch((e) => {
                setSubmitting(false)
                setError(e.toString())
            })
    }

    return (
        <>
            <div>
                <Logo className="h-12! w-12!"/>
                <Heading className="mt-6" size="2xl" as="h2">
                    Sign in
                </Heading>
                <p className="mt-2 text-sm text-gray-600">
                    Or{' '}
                    <Link href="/id/create" className="font-medium">
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-8 space-y-8">
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Login failed!</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <form method="POST" className="space-y-6" onSubmit={loginUser}>
                    <div>
                        <Input id="email" type="email" label="Email Address" required/>
                    </div>

                    <div className="space-y-1">
                        <Input id="password" label="Password" type="password" autoComplete="current-password" required/>
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Supabase enforces session expiry. */}
                        {/*<div className="flex items-center">*/}
                        {/*    <Checkbox id="remember-me"*/}
                        {/*              name="remember-me"/>*/}
                        {/*    <label htmlFor="remember-me" className="ml-2 block text-sm">*/}
                        {/*        Remember me*/}
                        {/*    </label>*/}
                        {/*</div>*/}

                        {/*<div className="text-sm">*/}
                        {/*    <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">*/}
                        {/*        Forgot your password?*/}
                        {/*    </a>*/}
                        {/*</div>*/}
                    </div>

                    <div>
                        <Button
                            color="indigo"
                            type="submit"
                            disabled={submitting}
                            className="flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            {!submitting ? 'Sign in' : <LoadingCircle/>}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}
