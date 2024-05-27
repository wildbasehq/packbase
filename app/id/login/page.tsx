import {createClientComponentClient} from '@supabase/auth-helpers-nextjs'
import UserInfoCol from '@/components/shared/user/info-col'
import Link from 'next/link'
import cx from 'classnames'
import {Button, buttonVariants} from '@/components/shared/buttonUI'
import {Heading, Text} from '@/components/shared/text'
import {ProjectName} from '@/lib/utils'
import {Input} from '@/components/shared/input/text'
import LoginGradient from '@/app/id/login/client/gradient'

export default function IDLogin({searchParams}: {
    searchParams: { error_description: string; error: string; };
}) {
    const supabase = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_KEY,
    })

    switch (searchParams?.error_description) {
        case 'The resource owner or authorization server denied the request': {
            searchParams.error_description = 'Login cancelled'
        }
    }

    async function signInWithDiscord() {
        await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                scopes: 'identify guilds',
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
    }

    return (
        <>
            {/* test */}
            <div className="animate-slide-down-fade absolute inset-0 bg-surface-container-low -z-10 dark:opacity-75" style={{
                // fit to screen
                background: 'url(/img/illustrations/home/fox-in-snowy-oasis.webp) center/cover no-repeat',
            }}>
                <LoginGradient />
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
                    }} />
                </div>
                <div
                    className="relative animate-slide-down-fade rounded bg-card-solid border shadow h-fit sm:max-w-md top-0 mx-auto">
                    <div className="lg:p-8">
                        <div className="flex flex-col justify-center space-y-6">
                            {process.env.NEXT_PUBLIC_REGISTRATION_CLOSE && (
                                <div className="flex flex-col space-y-2 text-center">
                                    <Heading size="2xl" className="text-2xl">
                                        Registration is closed.
                                    </Heading>
                                    <Text>
                                        {ProjectName} is not open for public registration.
                                    </Text>
                                </div>
                            )}

                            {!process.env.NEXT_PUBLIC_REGISTRATION_CLOSE && (
                                <>
                                    <div className="flex flex-col space-y-2 text-center">
                                        <h1 className="text-2xl font-semibold tracking-tight">
                                            Create an account
                                        </h1>
                                    </div>
                                    <form className="space-y-1">
                                        <div>
                                            <Input id="register-email" label="E-Mail" type="email" />
                                        </div>
                                        <div>
                                            <Input id="register-pass" label="Password" type="password" />
                                        </div>
                                        <div>
                                            <Input id="register-pass-conf" label="Confirm Password" type="password" />
                                        </div>
                                        <Button>
                                            Register
                                        </Button>
                                    </form>
                                    <p className="px-8 text-center text-sm text-muted-foreground">
                                        By clicking continue, you agree to our{" "}
                                        <Link
                                            href="/terms"
                                            className="underline underline-offset-4 hover:text-primary"
                                        >
                                            Terms of Service
                                        </Link>{" "}
                                        and{" "}
                                        <Link
                                            href="/privacy"
                                            className="underline underline-offset-4 hover:text-primary"
                                        >
                                            Privacy Policy
                                        </Link>
                                        .
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}