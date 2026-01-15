/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {LoadingDots} from '@/components/icons'
import SadComputerIcon from '@/components/icons/sad-computer'
import Body from '@/components/layout/body'
import PackJoinCTA from '@/components/pack/pack-join-cta'
import {Heading, Text} from '@/components/shared/text'
import {CustomTheme} from '@/components/shared/theme/custom-theme'
import {isVisible} from '@/lib'
import {vg} from '@/lib/api'
import {SidebarPortal} from '@/lib/context/sidebar-context'
import {useResourceStore, useUIStore} from '@/lib/state'
import {PackChannels} from '@/src/components'
import {OrbitIcon} from 'lucide-react'
import {Activity, ReactNode, useEffect, useState} from 'react'
import {useParams} from 'wouter'

export default function PackLayout({children}: { children: ReactNode }) {
    const {loading, setLoading, setNavigation} = useUIStore()
    const {resources, currentResource, resourceDefault, setCurrentResource, setResources} = useResourceStore()
    const [error, setError] = useState<any>(null)

    const {slug} = useParams<{ slug: string }>()

    useEffect(() => {
        const tempResources = resources.slice()

        if (currentResource.slug !== slug) {
            // Search resources for id that matches slug
            const resource = tempResources.find(r => r.slug === slug)
            if (resource) {
                setCurrentResource(resource)
            } else {
                setCurrentResource(resourceDefault)
            }
        }

        if (slug) {
            setLoading(true)
            setError(null)
            vg.pack({id: slug})
                .get({query: {scope: 'pages'}})
                .then(res => {
                    setLoading(false)

                    if (res.status === 404) {
                        setError({cause: 404, message: 'Not Found'})
                        setNavigation([])
                    } else {
                        // Builds the navigation menu for the pack. Forces 'Home' to be the first item, then adds the rest from API.
                        let naviBuild = []

                        for (const page of res.data?.pages || []) {
                            naviBuild.push({
                                id: page.id,
                                name: page.title,
                                description: page.description,
                                href: `/p/${slug}/${page.id}`,
                                icon: page.icon || OrbitIcon,
                                ticker: page.ticker,
                                query: page.query || null,
                            })
                        }
                        setNavigation(naviBuild)

                        const resource = tempResources.find(r => r.id === res.data.id)
                        if (!resource) {
                            res.data.temporary = true
                            tempResources.push(res.data)
                            setResources(tempResources)
                            if (currentResource.slug !== slug) setCurrentResource(res.data)
                        }
                    }
                })
                .catch((e: any) => {
                    setNavigation([])
                    setError(e)
                    setLoading(false)
                })
        }
    }, [slug])

    if (error || loading)
        return (
            <Body className="h-full items-center justify-center">
                <div className="flex max-w-md flex-col">
                    {!error && (
                        <>
                            <Heading className="items-center">
                                <img
                                    src="/img/ghost-dog-in-box.gif"
                                    alt="Animated pixel dog in box panting before falling over, then looping."
                                    className="h-6"
                                    style={{
                                        imageRendering: 'pixelated',
                                        display: 'inline-block',
                                        marginTop: '-1px',
                                        marginRight: '4px',
                                    }}
                                />
                                Entering {slug}...
                            </Heading>
                            <p className="text-muted-foreground mt-1 items-center align-middle text-sm leading-6">
                                <LoadingDots className="-mt-1 mr-1 inline-block"/>
                                Locating {slug} in the Cosmos, hang tight!
                            </p>
                        </>
                    )}

                    {error && (
                        <>
                            <Body bodyClassName="h-full" className="h-full! items-center justify-center">
                                <div className="max-w-md flex items-center justify-center gap-2">
                                    <SadComputerIcon className="h-16 -mt-2 w-fit self-start mx-auto"/>
                                    <div>
                                        <Heading className="text-2xl/6">
                                            {error.cause === 404 ? `The Cosmos can't find ${slug}` : `Packbase can\'t continue`}
                                        </Heading>
                                        <Text className="mb-4">
                                            {error.cause === 404 ? (
                                                <span>
                                                    This pack may no longer exist as it isn't in our database.
                                                    <br/>
                                                    <br/>
                                                    If you came here from your pack list, please reload to update it &mdash; they
                                                    might've changed their @name.
                                                </span>
                                            ) : (
                                                `${error.cause || 'Something went wrong'}: ${error.message || error.stack}`
                                            )}
                                        </Text>
                                    </div>
                                </div>
                            </Body>
                        </>
                    )}
                </div>
            </Body>
        )

    return (
        <div className="relative">
            <SidebarPortal>
                <PackChannels/>
            </SidebarPortal>

            <Activity mode={isVisible(currentResource.temporary)}>
                <PackJoinCTA/>
            </Activity>

            {currentResource && <CustomTheme packId={currentResource.id}/>}
            {children}
        </div>
    )
}
