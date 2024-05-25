'use client'
// @ts-ignore
import * as HoverCard from '@radix-ui/react-hover-card'
import {createClientComponentClient} from '@supabase/auth-helpers-nextjs'
import UserAvatar from '@/components/shared/user/avatar'
import {UserInfo} from '@/components/shared/user/info-col'
import Link from 'next/link'
import cx from 'classnames'
import {Button, buttonVariants} from '@/components/shared/buttonUI'
import {Heading, Text} from '@/components/shared/text'
import {ProjectName} from '@/lib/utils'
import { ShaderGradientCanvas, ShaderGradient } from 'shadergradient'
import {Input} from '@/components/shared/input/text'

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
                <ShaderGradientCanvas
                    style={{
                        position: 'absolute',
                        top: 0,
                        opacity: 0.85,
                        // backdropFilter: 'blur(1em)'
                    }}
                >
                    <ShaderGradient
                        control='props'
                        animate="on"
                        color1="#606080"
                        color2="#a78bfa"
                        color3="#212121"
                        grain="on"
                        brightness={1}
                        cAzimuthAngle={120}
                        cDistance={3.5}
                        cPolarAngle={80}
                        cameraZoom={9.1}
                        envPreset="city"
                        frameRate={1}
                        grainBlending={0.3}
                        lightType="3d"
                        positionX={-1}
                        positionY={2.8}
                        positionZ={0}
                        rotationX={-75}
                        rotationY={0}
                        rotationZ={-60}
                        type="waterPlane"
                        uAmplitude={0}
                        uFrequency={0}
                        uSpeed={0.05}
                        uStrength={1.5}
                        uTime={8}
                        // enableTransition={false}
                    />
                </ShaderGradientCanvas>
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
                    <HoverCard.Root>
                        <HoverCard.Trigger className="w-fit">
                            <div
                                className="z-20 flex pointer-events-none items-center text-lg p-2 font-medium bg-background rounded">
                                <UserInfo size="lg" user={{
                                    display_name: 'Bernie 🐻',
                                    username: 'bernie_burr',
                                    avatar: '/img/illustrations/onboarding/pfp/bernie_burr.png'
                                }}/>
                            </div>
                        </HoverCard.Trigger>
                        <HoverCard.Portal>
                            <HoverCard.Content
                                className="relative data-[side=bottom]:animate-slide-up-fade-snapper data-[side=right]:animate-slideLeftAndFade data-[side=left]:animate-slideRightAndFade data-[side=top]:animate-slide-down-fade w-96 bg-background rounded-md p-5 shadow-md border data-[state=open]:transition-all"
                                sideOffset={5}
                                collisionPadding={{left: 32}}
                            >
                                {/*<div className="absolute top-0 right-0 w-full h-full -z-[1]">*/}
                                {/*    <div className="absolute w-full h-full bg-background/90 rounded" />*/}
                                {/*    <img src="https://api.yipnyap.me/vault/@server/uploads/members/256/cover-image/6378402f65b8b-yp-cover-image.jpg" className="w-full h-full object-cover rounded object-center" alt="Cover image" />*/}
                                {/*</div>*/}
                                <div className="flex flex-col gap-[7px]">
                                    <UserAvatar size="3xl" user={{
                                        display_name: 'Bernie 🐻',
                                        username: 'bernie_burr',
                                        avatar: 'https://api.yipnyap.me/vault/@server/uploads/members/256/avatars/1668891639-bpfull.png'
                                    }}/>
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <div className="text-md">Bernie 🐻</div>
                                            <div className="text-sm text-alt">@bernie_burr</div>
                                        </div>
                                        <div className="text-sm">
                                            I draw
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex gap-1">
                                                <div className="text-sm font-medium">2</div>
                                                {' '}
                                                <div className="text-sm">Following</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <div className="text-sm font-medium">1</div>
                                                {' '}
                                                <div className="text-sm">Followers</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <HoverCard.Arrow className="fill-white"/>
                            </HoverCard.Content>
                        </HoverCard.Portal>
                    </HoverCard.Root>
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
                                        <p className="text-sm text-muted-foreground">
                                            Enter your email below to create your account
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div>
                                            <Input id="register-email" label="E-Mail" type="email" />
                                        </div>
                                        <div>
                                            <Input id="register-pass" label="Password" type="password" />
                                        </div>
                                        <div>
                                            <Input id="register-pass-conf" label="Confirm Password" type="password" />
                                        </div>
                                        <div>
                                            <Button>
                                                Register
                                            </Button>
                                        </div>
                                    </div>
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