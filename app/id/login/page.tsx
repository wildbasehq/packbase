'use client'
import UserInfoCol from '@/components/shared/user/info-col'
import Link from 'next/link'
import cx from 'classnames'
import {Button, buttonVariants} from '@/components/shared/ui/button'
import {Input} from '@/components/shared/input/text'
import LoginGradient from '@/app/id/create/client/gradient'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/ui/alert'
import {createClient} from '@/lib/supabase/client'
import {FormEvent, useState} from 'react'
import {LoadingCircle} from '@/components/shared/icons'

export default function IDLogin({searchParams}: {
    searchParams: {
        error_description?: string;
        error?: string;
        redirect?: string;
    };
}) {
    const [submitting, setSubmitting] = useState(false)
    switch (searchParams?.error_description) {
        case 'The resource owner or authorization server denied the request': {
            searchParams.error_description = 'Login cancelled'
        }
    }

    const loginUser = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const user = {
            email: formData.get('login-email')?.toString() || '',
            password: formData.get('login-password')?.toString() || ''
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
            {/* test */}
            <div className="animate-slide-down-fade absolute inset-0 -z-10 dark:opacity-75" style={{
                // fit to screen
                background: 'url(/img/illustrations/home/fox-in-snowy-oasis.webp) center/cover no-repeat',
            }}>
                <LoginGradient/>
            </div>

            <div
                className="container relative flex h-full flex-col items-center justify-center lg:max-w-none lg:px-0">
                <Link
                    href="/id/unlock"
                    className={cx(
                        buttonVariants({variant: 'ghost'}),
                        'absolute right-4 top-4 md:right-8 md:top-8'
                    )}
                >
                    Login
                </Link>
                <div className="absolute hidden left-0 h-full flex-col p-8 text-white lg:flex">
                    <UserInfoCol user={{
                        display_name: 'Rek ✨',
                        username: 'rek',
                        avatar: '/img/illustrations/onboarding/pfp/rekkisomo.png'
                    }}/>
                </div>
                <div
                    className="relative animate-slide-down-fade rounded bg-card-solid border shadow h-fit sm:max-w-md top-0 mx-auto">
                    <div className="lg:p-8">
                        <div className="flex flex-col justify-center space-y-6">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Welcome Back!
                                </h1>
                            </div>

                            {searchParams?.error_description && (
                                <Alert variant="destructive">
                                    <AlertTitle>
                                        {searchParams.error}
                                    </AlertTitle>
                                    <AlertDescription>
                                        {searchParams.error_description}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <form className="space-y-1" onSubmit={loginUser}>
                                <div>
                                    <Input id="login-email" label="E-Mail" type="email"/>
                                </div>
                                <div>
                                    <Input id="login-password" label="Password" type="password"/>
                                </div>
                                <Button type="submit" variant={!submitting ? 'default' : 'ghost'}>
                                    {!submitting ? 'Login' : (
                                        <LoadingCircle className="h-5 w-5"/>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}