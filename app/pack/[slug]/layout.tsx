'use client'
import Body from '@/components/layout/body'
import { LoadingDots } from '@/components/shared/icons'
import { Heading } from '@/components/shared/text'
import { vg } from '@/lib/api'
import { useResourceStore, useUIStore } from '@/lib/states'
import { ProjectName, ProjectSafeName } from '@/lib/utils'
import { FaceFrownIcon, HomeIcon } from '@heroicons/react/24/solid'
import { OrbitIcon } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function PackLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
    const { resourceDefault, loading, setLoading, setNavigation } = useUIStore()
    const { resources, currentResource, setCurrentResource, setResources } = useResourceStore()
    const [error, setError] = useState<any>(null)
    const { slug } = params

    useEffect(() => {
        const tempResources = resources.slice()

        if (currentResource.slug !== slug) {
            // Search resources for id that matches slug
            const resource = tempResources.find((r) => r.slug === slug)
            if (resource) {
                setCurrentResource(resource)
            } else {
                setCurrentResource(resourceDefault)
            }
        }

        if (slug) {
            setLoading(true)
            setError(null)
            vg.pack({ id: slug })
                .get({ query: { scope: 'exists' } })
                .then((res) => {
                    setLoading(false)

                    if (res.status === 404) {
                        setError({ cause: 404, message: 'Not Found' })
                        setNavigation([
                            {
                                name: 'Back to the Universe',
                                description: '',
                                href: '/p/universe',
                                icon: OrbitIcon,
                            },
                        ])
                    } else {
                        setNavigation([
                            {
                                name: 'Home',
                                description: '',
                                href: `/p/${slug}`,
                                icon: HomeIcon,
                            },
                        ])

                        const resource = tempResources.find((r) => r.id === res.data.id)
                        if (!resource && slug !== 'universe') {
                            res.data.temporary = true
                            tempResources.push(res.data)
                            setResources(tempResources)
                            if (currentResource.slug !== slug) setCurrentResource(res.data)
                        }
                    }
                })
                .catch((e: any) => {
                    setNavigation([
                        {
                            name: 'Back to the Universe',
                            description: '',
                            href: '/p/universe',
                            icon: OrbitIcon,
                        },
                    ])
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
                                <Image
                                    src="/img/ghost-dog-in-box.gif"
                                    alt="Animated pixel dog in box panting before falling over, then looping."
                                    height={32}
                                    width={38}
                                    unoptimized
                                    style={{
                                        imageRendering: 'pixelated',
                                        display: 'inline-block',
                                        marginTop: '-1px',
                                        marginRight: '4px',
                                    }}
                                />
                                Entering {slug}...
                            </Heading>
                            <p className="text-alt mt-1 items-center align-middle text-sm leading-6">
                                <LoadingDots className="-mt-1 mr-1 inline-block" />
                                Locating {slug} in the Cosmos, hang tight!
                            </p>
                        </>
                    )}

                    {error && (
                        <>
                            <Heading className="items-center">
                                <FaceFrownIcon className="text-default mr-1 inline-block h-6 w-6" />
                                {error.cause === 404 ? `The Cosmos can't find ${slug}` : `${ProjectSafeName} can\'t continue`}
                                {error.cause === 404 && slug === 'universe' && `. Someone setup ${ProjectSafeName} wrong :/`}
                            </Heading>
                            <p className="text-alt mt-1 text-sm leading-6">
                                {error.cause === 404 ? (
                                    <span>
                                        This pack may no longer exist as it isn't in our database.
                                        <br />
                                        <br />
                                        {slug === 'universe' ? (
                                            <>
                                                Someone internally screwed something up, it ain't your fault! If the universe pack is missing, chances are *a lot* of
                                                other post data is missing as well. Or someone accidentally changed the universe slug, either way, you'll have to wait.
                                                Sorry!
                                                <br />
                                                <br />
                                                If you're a developer and this is your first time running {ProjectName}, you'll need to create a new pack with the{' '}
                                                <code>universe</code> slug. You can do this with the site public, as the user needs the <code>GLOBAL_ADMIN</code>{' '}
                                                permission to create a pack with that slug, but users will see this screen...
                                            </>
                                        ) : (
                                            <>If you came here from your pack list, please reload to update it &mdash; they might've changed their @name.</>
                                        )}
                                    </span>
                                ) : (
                                    `${error.cause || 'Something went wrong'}: ${error.message || error.stack}`
                                )}
                            </p>
                        </>
                    )}
                </div>
            </Body>
        )

    return children
}
