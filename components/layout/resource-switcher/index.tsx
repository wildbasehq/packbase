'use client'

import { ExpandingArrow, LoadingCircle } from '@/components/shared/icons'
import { Logo } from '@/components/shared/logo'
import { Heading, Text } from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import useComponentVisible from '@/lib/hooks/use-component-visible'
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/states'
import { createRef, useEffect, useState } from 'react'
import useSound from 'use-sound'
import { PlayFunction } from 'use-sound/dist/types'
import './resource-switcher.component.scss'
import { Dropdown, DropdownHeader, DropdownMenu } from '@/components/shared/dropdown'
import { MenuButton, MenuItem } from '@headlessui/react'
import Link from 'next/link'
import LogoutIcon from '@/components/shared/icons/logout'
import { vg } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useModal } from '@/components/modal/provider'
import { SettingsIcon } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import clsx from 'clsx'
import { Input } from '@/components/shared/input/text'
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/ui/alert'
import { ClipboardIcon } from '@heroicons/react/20/solid'
import { UserCircleIcon } from '@heroicons/react/24/solid'

export default function ResourceSwitcher() {
    const hoverCancelSFX = '/sounds/switch-hover-s.ogg'
    // sound refs
    const [cancelSound] = useSound(hoverCancelSFX, {
        volume: 0.35,
        playbackRate: 0.25,
    })
    const [hoverSound] = useSound(hoverCancelSFX, {
        volume: 0.25,
        playbackRate: 0.5,
        interrupt: true,
    })
    const [heavyHoverSound] = useSound('/sounds/switch-hover-s.ogg', {
        playbackRate: 0.3,
    })

    const { currentResource } = useResourceStore()

    const { loading, connecting } = useUIStore()
    const { ref } = useComponentVisible({
        soundOnClose: cancelSound,
    })
    // fuck you nextjs
    const [domReady, setDomReady] = useState(false)

    const playSound = (sound: PlayFunction) => {
        sound()
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDomReady(true)
        }
    }, [])

    return (
        <>
            {domReady && !connecting ? (
                <div
                    ref={ref}
                    className={`group flex select-none flex-row items-center justify-between ${loading ? '!cursor-no-drop' : ''}`}
                    aria-label="Switch resource"
                    title={loading ? 'Resource is still switching...' : 'Switch resource'}
                    onAnimationEnd={() => {
                        ref.current?.classList.remove('[&>*>*]:animate-shake')
                    }}
                    onMouseEnter={() => {
                        playSound(hoverSound)
                    }}
                    onMouseLeave={() => {
                        playSound(cancelSound)
                    }}
                >
                    <Dropdown>
                        <MenuButton
                            className="w-full"
                            onClick={(e) => {
                                if (loading || currentResource.standalone || currentResource.temporary) {
                                    e.preventDefault()
                                    ref.current?.classList.add('[&>*>*]:animate-shake')
                                    return playSound(heavyHoverSound)
                                }
                            }}
                        >
                            <span className="z-10 flex w-full items-center justify-between">
                                <div className="flex h-10 items-center space-x-2">
                                    {!currentResource || (currentResource.standalone && !currentResource.icon) ? (
                                        <Logo className="w-8" />
                                    ) : (
                                        <UserAvatar
                                            name={currentResource.display_name}
                                            size={32}
                                            icon={currentResource.icon}
                                            className="inline-flex h-8 w-8 overflow-hidden"
                                        />
                                    )}
                                    <Text className="font-bold">{currentResource.display_name}</Text>
                                </div>
                                <ExpandingArrow className="right-0 -mt-1 h-6 w-6 rotate-90 text-neutral-500 transition-all dark:text-white" />
                            </span>
                        </MenuButton>
                        <DropdownMenu className="z-50 -mt-16 rounded-tl-none rounded-tr-none !p-0">
                            <MenuItem>{({ close }) => <ResourceSwitcherMenu close={close} />}</MenuItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            ) : (
                <div className="shimmer-template flex cursor-pointer select-none flex-row items-center justify-between">
                    <span className="z-10 flex w-full items-center justify-between">
                        <div className="flex h-10 items-center space-x-2">
                            <LoadingCircle />
                            <Text className="font-bold">Connecting</Text>
                        </div>
                    </span>
                </div>
            )}
        </>
    )
}

function ResourceSwitcherMenu({ close }: { close: () => void }) {
    const { currentResource: pack } = useResourceStore()
    const { user } = useUserAccountStore()
    const { show, hide } = useModal()

    return (
        <DropdownHeader className="flex w-96 flex-col !p-0">
            <div className="h-fit w-full rounded-bl rounded-br bg-white/50 shadow dark:bg-n-6/50">
                <div className="p-2">
                    <Link href={`/p/${pack.slug}`} className="!no-underline">
                        <div className="ring-default flex items-center rounded px-4 py-4 transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50">
                            <UserAvatar user={pack} size="lg" />
                            <div className="ml-3 grow">
                                <Heading>{pack.display_name || pack.slug}</Heading>
                                <Text alt>{pack.slug}</Text>
                            </div>
                            {user.id === pack.owner_id && (
                                <div
                                    onClick={() => {
                                        close()
                                        show(<ResourceSettingsModal />)
                                    }}
                                >
                                    {/* mt-1 to offset button */}
                                    <Button variant="ghost" size="icon" className="mt-1 h-5 w-5 cursor-pointer">
                                        <SettingsIcon className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Link>
                </div>
            </div>

            <div className="inline-flex w-full flex-col gap-2 px-3 py-2">
                <div
                    className="group inline-flex w-full cursor-pointer items-center justify-start gap-4 rounded px-4 py-3 ring-destructive/25 transition-all hover:bg-destructive/75 hover:ring-2"
                    onClick={() => {
                        vg.pack({ id: pack.id })
                            .join.delete()
                            .then(() => {
                                window.location.reload()
                            })
                            .catch((e) => {
                                toast.error(e.message)
                            })
                    }}
                >
                    <LogoutIcon className="fill-alt h-4 w-4 group-hover:fill-white" />{' '}
                    <Text alt className="group-hover:text-white">
                        Leave pack
                    </Text>
                </div>
            </div>
        </DropdownHeader>
    )
}

function ResourceSettingsModal() {
    const [currentPage, setCurrentPage] = useState('General Information')

    const { currentResource, resources, setResources, setCurrentResource } = useResourceStore()

    // For pack avatar upload
    const [profilePicUpload, setProfilePicUpload] = useState<File | undefined>()
    const [profilePicPreview, setProfilePicPreview] = useState<string | undefined>()

    useEffect(() => {
        if (profilePicUpload) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfilePicPreview(reader.result as string)
            }
            reader.readAsDataURL(profilePicUpload)
        } else {
            setProfilePicPreview(undefined)
        }
    }, [profilePicUpload])

    const fields = {
        display_name: {
            ref: createRef<HTMLInputElement>(),
        },
        slug: {
            ref: createRef<HTMLInputElement>(),
        },
        description: {
            ref: createRef<HTMLInputElement>(),
            type: 'textarea',
            api: 'about.bio',
        },
    }

    useEffect(() => {
        for (let ref in fields) {
            if (fields[ref].ref?.current) {
                if (fields[ref].api) {
                    fields[ref].ref.current.value = getObjectFromStringPath(currentResource, fields[ref].api) || ''
                } else {
                    fields[ref].ref.current.value = currentResource[ref] || ''
                }
            }
        }
    }, [])

    const getObjectFromStringPath = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj)
    }

    const pages = [
        {
            title: 'General Information',
            description: 'Change pack information',
            icon: ClipboardIcon,
        },
        // {
        //     title: 'Delete pack',
        //     description: 'Delete this pack',
        //     href: `/p/${pack.slug}/delete`,
        //     icon: TrashIcon,
        // },
    ]

    const snakeToTitle = (str: string) => {
        return str
            .split('__')[0]
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const aggregateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const packUpdate = {
            images: {
                avatar: profilePicPreview,
            },
        }
        for (let field in fields) {
            if (fields[field].api) {
                // 'about.bio' -> { about: { bio: value } }
                const path = fields[field].api.split('.')
                let obj = packUpdate
                for (let i = 0; i < path.length - 1; i++) {
                    obj[path[i]] = {}
                    obj = obj[path[i]]
                }
                obj[path[path.length - 1]] = fields[field].ref?.current.value
            } else {
                packUpdate[field] = fields[field].ref?.current.value
            }
        }
        vg.pack({ id: currentResource.id })
            .post(packUpdate)
            .then(({ data, error }) => {
                if (error) {
                    toast.error(
                        `Whoops! ${error.status}: ${
                            (error.status as unknown as number) === 403 ? 'You are not authorized to perform this action.' : error.value.summary
                        }${error.value.property ? ` (/${error.value.on}${error.value.property})` : ''}`,
                    )
                } else {
                    toast.success('Settings saved!')
                    // Set resources to reflect changes
                    const newResources = resources.map((r) => (r.id === currentResource.id ? { ...r, ...packUpdate } : r))
                    setResources(newResources)
                    setCurrentResource(newResources.find((r) => r.id === currentResource.id))
                }
            })
            .catch((e) => {
                toast.error(e.status)
            })
    }

    return (
        <div className="flex h-[50vh] max-h-full w-[50vw] gap-4">
            <div className="flex w-80 flex-col !p-0">
                <div className="h-fit w-full rounded-br bg-white/50 ring-2 ring-shadow dark:bg-n-6/50">
                    <div className="flex items-center rounded px-6 py-6">
                        <UserAvatar user={currentResource} size="lg" />
                        <div className="ml-3 grow">
                            <Heading>{currentResource.display_name || currentResource.slug}</Heading>
                            <Text alt>{currentResource.slug}</Text>
                        </div>
                    </div>
                </div>

                <div className="inline-flex h-full w-72 flex-col gap-2 border-r-2 border-n-2/50 px-3 py-2 dark:border-n-6/80">
                    {pages.map((page, i) => (
                        <div key={i} className="text-default !no-underline" onClick={() => setCurrentPage(page.title)}>
                            <div
                                className={clsx(
                                    page.title === currentPage ? 'bg-n-2/25 dark:bg-n-6/50' : 'hover:bg-n-2/25 dark:hover:bg-n-6/50',
                                    'ring-default/25 ring-default group inline-flex w-full items-center justify-start gap-4 rounded px-4 py-3 transition-all hover:ring-2',
                                )}
                            >
                                <page.icon className="fill-alt h-4 w-4" />
                                <Text alt>{page.title}</Text>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main settings portion with buttons on bottom-right at all times*/}
            <form className="flex h-full flex-1 flex-col gap-4 p-6" onSubmit={aggregateSubmit}>
                <div className="flex flex-1 flex-col gap-4">
                    <div>
                        <Heading>Settings</Heading>
                        <Text alt>Change pack settings</Text>
                    </div>

                    <Alert variant="destructive">
                        <AlertTitle>Trinkets will be required soon!</AlertTitle>
                        <AlertDescription>
                            Trinkets (T) are a new feature that will be required to perform certain actions in the future. You can earn trinkets from your community
                            interacting with your pack, which is already counting! You can never buy or exchange Trinkets with real money.
                        </AlertDescription>
                    </Alert>

                    {/* form */}
                    <div className="flex flex-col gap-2">
                        <div className="col-span-full">
                            <label htmlFor="avatar" className="text-default block select-none text-sm font-medium leading-6">
                                Photo
                            </label>
                            <input
                                type="file"
                                name="avatar"
                                accept="image/*"
                                id="avatar"
                                className="hidden"
                                onChange={(e) => setProfilePicUpload(e.target.files?.[0] || undefined)}
                            />
                            <div className="mt-2 flex items-center gap-x-3">
                                {!profilePicPreview ? (
                                    <UserCircleIcon className="text-alt h-12 w-12" aria-hidden="true" />
                                ) : (
                                    <UserAvatar icon={profilePicPreview} size="lg" />
                                )}
                                <Button asChild variant="outline" onClick={() => document.getElementById('avatar')?.click()}>
                                    <div>Upload</div>
                                </Button>
                            </div>
                            <p className="text-alt mt-3 select-none text-sm leading-6">We don't resize your photo. Scroll up to the header to see how it will look.</p>
                        </div>

                        {Object.keys(fields).map((key, i) => (
                            <div key={i}>
                                <Input ref={fields[key].ref} name={snakeToTitle(key)} label={snakeToTitle(key)} type={fields[key].type || 'text'} rows={4} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* buttons */}
                <div className="flex justify-end gap-4">
                    {/*<Button variant="ghost" onClick={() => hide()}>*/}
                    {/*    Cancel*/}
                    {/*</Button>*/}
                    <Button variant="primary">Save</Button>
                </div>
            </form>
        </div>
    )
}
