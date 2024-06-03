'use client'
import {createClient} from '@/lib/supabase/client'
import {FormEvent, useState} from 'react'
import {Logo} from '@/components/shared/logo'
import {Heading} from '@/components/shared/text'
import {Input} from '@/components/shared/input/text'
import {Button} from '@/components/shared/ui/button'
import Link from 'next/link'
import {LoadingCircle} from '@/components/shared/icons'
import {useUserAccountStore} from '@/lib/states'

export default function IDLogin({searchParams}: {
    searchParams: {
        error_description?: string;
        error?: string;
        redirect?: string;
    };
}) {
    const {user} = useUserAccountStore()
    const [submitting, setSubmitting] = useState(false)
    switch (searchParams?.error_description) {
        case 'The resource owner or authorization server denied the request': {
            searchParams.error_description = 'Login cancelled'
        }
    }

    if (user) return window.location.href = '/'

    const loginUser = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const user = {
            email: formData.get('email')?.toString() || '',
            password: formData.get('password')?.toString() || '',
        }
        const supabase = createClient()
        supabase.auth.signInWithPassword(user).then(r => {
            console.log(r)
            if (r.error) {
                window.location.href = `/id/login?error=Serverland Error&error_description=${r.error.toString()}`
            } else {
                window.location.href = searchParams?.redirect || '/'
            }
        }).catch(e => {
            setSubmitting(false)
            window.location.href = `/id/login?error=Serverland Error&error_description=${e.toString()}`
        })
    }

    return (
        <>
            <div>
                <Logo className="!h-12 !w-12"/>
                <Heading className="mt-6" size="2xl" as="h2">Sign in</Heading>
                <p className="mt-2 text-sm text-gray-600">
                    Or{' '}
                    <Link href="/id/create"
                          className="font-medium">
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-8">
                <form method="POST" className="space-y-6" onSubmit={loginUser}>
                    <div>
                        <Input id="email" type="email" label="Email Address" required/>
                    </div>

                    <div className="space-y-1">
                        <Input
                            id="password"
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            required
                        />
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
                            variant="default"
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {!submitting ? 'Register' : <LoadingCircle/>}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}