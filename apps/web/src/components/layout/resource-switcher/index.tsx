/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {ExpandingArrow, LoadingCircle} from '@/components/icons'
import {Heading, Text} from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import useComponentVisible from '@/lib/hooks/use-component-visible'
import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/state'
import {Dropdown, DropdownHeader, DropdownMenu} from '@/components/shared/dropdown'
import {MenuButton, MenuItem} from '@headlessui/react'
import LogoutIcon from '@/components/icons/logout'
import {vg} from '@/lib/api'
import {toast} from 'sonner'
import {useModal} from '@/components/modal/provider'
import {Button} from '@/components/shared/button'
import {ClipboardIcon, Cog6ToothIcon, UserGroupIcon} from '@heroicons/react/20/solid'
import {Avatar} from '@/components/shared/avatar'
import ResourceSettingsGeneral from './pages/general'
import ResourceSettingsMembers from '@/components/layout/resource-switcher/pages/members.tsx'
import {VerifiedBadge} from '@/components/layout/resource-switcher/pack-badge.tsx'
import PagedModal from '@/components/shared/paged-modal'
import ResourceSettingsTheme from '@/components/layout/resource-switcher/pages/theme.tsx'
import {SwatchIcon} from '@heroicons/react/16/solid'
import {useContentFrame} from '@/src/components'
import ServerConfigRender, {decideCategoryDescription} from '@/components/shared/input/server-config-render.tsx'
import {Activity} from "react";
import {isVisible} from "@/lib";

export default function ResourceSwitcher() {
    const {currentResource} = useResourceStore()

    const {loading, connecting} = useUIStore()
    const {ref} = useComponentVisible()

    return (
        <>
            <Activity mode={isVisible(connecting)}>
                <div className="flex cursor-pointer select-none flex-row items-center justify-between">
                    <span className="z-10 flex w-full items-center justify-between">
                        <div className="flex h-10 items-center space-x-2">
                            <LoadingCircle/>
                            <Text className="font-bold">Connecting</Text>
                        </div>
                    </span>
                </div>
            </Activity>

            <Activity mode={isVisible(!connecting)}>
                <div
                    ref={ref}
                    className={`group flex select-none flex-row items-center justify-between ${loading ? 'cursor-no-drop!' : ''}`}
                    aria-label="Switch resource"
                    title={loading ? 'Resource is still switching...' : 'Open pack options'}
                    onAnimationEnd={() => {
                        ref.current?.classList.remove('[&>*>*]:animate-shake')
                    }}
                >
                    <Dropdown>
                        <MenuButton
                            className="w-full"
                            onClick={e => {
                                if (loading || currentResource.standalone || currentResource.temporary) {
                                    e.preventDefault()
                                    ref.current?.classList.add('[&>*>*]:animate-shake')
                                }
                            }}
                        >
                            <span className="z-10 flex w-full items-center justify-between">
                                <div className="flex h-10 items-center space-x-2">
                                    <Activity
                                        mode={isVisible((currentResource.verified || currentResource.standalone || currentResource.slug === 'support'))}>
                                        <VerifiedBadge
                                            tooltipText="This is an official pack which represents the creator or organisation behind it."/>
                                    </Activity>

                                    <Text className="font-bold">{currentResource.display_name}</Text>
                                </div>
                                <ExpandingArrow
                                    className="right-0 -mt-1 h-6 w-6 rotate-90 text-muted-foreground transition-all dark:text-white"/>
                            </span>
                        </MenuButton>
                        <DropdownMenu className="z-50 -mt-16 rounded-tl-none rounded-tr-none p-0!">
                            <MenuItem>{({close}) => <ResourceSwitcherMenu close={close}/>}</MenuItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </Activity>
        </>
    )
}

function ResourceSwitcherMenu({close}: { close: () => void }) {
    const {currentResource: pack} = useResourceStore()
    const {user} = useUserAccountStore()
    const {show} = useModal()

    return (
        <DropdownHeader className="flex w-96 flex-col p-0!">
            <div className="h-fit w-full rounded-bl rounded-br bg-white/50 shadow-sm dark:bg-n-6/50">
                <div className="p-2">
                    <div
                        className="ring-default flex items-center rounded px-4 py-4 transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50"
                        onClick={() => {
                            if (user.id === pack.owner_id) {
                                close()
                                show(<ResourceSettingsModal/>)
                            }
                        }}
                    >
                        <UserAvatar user={pack} size="lg"/>
                        <div className="ml-3 grow">
                            <Heading>{pack.display_name || pack.slug}</Heading>
                            <Text alt>{pack.slug}</Text>
                        </div>
                        {user.id === pack.owner_id && (
                            <div>
                                {/* mt-1 to offset button */}
                                <Button plain className="mt-1 h-5 w-5 cursor-pointer">
                                    <Cog6ToothIcon className="h-5 w-5"/>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="inline-flex w-full flex-col gap-2 px-3 py-2">
                <div
                    className="group inline-flex w-full cursor-pointer items-center justify-start gap-4 rounded px-4 py-3 ring-destructive/25 transition-all hover:bg-destructive/75 hover:ring-2"
                    onClick={() => {
                        vg.pack({id: pack.id})
                            .join.delete()
                            .then(() => {
                                window.location.reload()
                            })
                            .catch(e => {
                                toast.error(e.message)
                            })
                    }}
                >
                    <LogoutIcon className="fill-alt h-4 w-4 group-hover:fill-white!"/>{' '}
                    <Text alt className="group-hover:text-white!">
                        Leave pack
                    </Text>
                </div>
            </div>
        </DropdownHeader>
    )
}

function ResourceSettingsModal() {
    const {currentResource} = useResourceStore()
    const {data} = useContentFrame('get', `pack/${currentResource.id}/settings`)
    // Get unique categories that are ONLY strings.
    const packSettingsCategories =
        data?.reduce(
            (acc, obj) => {
                const category = obj.definition.category
                if (category) {
                    if (!acc[category]) acc[category] = []
                    acc[category].push(obj)
                }
                return acc
            },
            {} as Record<string, any[]>
        ) ?? {}

    // Create the resource profile footer component
    const ResourceProfileFooter = (
        <div className="flex items-center">
            <Avatar
                square
                className="w-12 h-12"
                initials={currentResource.display_name?.charAt(0)}
                alt={currentResource.display_name}
                src={currentResource.images?.avatar}
            />
            <div className="ml-3 grow">
                <Heading>{currentResource.display_name || currentResource.slug}</Heading>
                <Text alt>{currentResource.slug}</Text>
            </div>
        </div>
    )

    return (
        <PagedModal footer={ResourceProfileFooter} className="h-[50vh] min-w-(--container-6xl) max-w-6xl">
            <PagedModal.Page id="general" title="General Information" description="Change pack information"
                             icon={ClipboardIcon}>
                <PagedModal.Body>
                    <ResourceSettingsGeneral/>
                </PagedModal.Body>
            </PagedModal.Page>

            <PagedModal.Page id="members" title="Members" description="Manage pack members" icon={UserGroupIcon}>
                <PagedModal.Body>
                    <ResourceSettingsMembers/>
                </PagedModal.Body>
            </PagedModal.Page>

            <PagedModal.Page id="theme" title="Theme" icon={SwatchIcon}>
                <PagedModal.Body>
                    <ResourceSettingsTheme/>
                </PagedModal.Body>
            </PagedModal.Page>

            {Object.keys(packSettingsCategories || {})?.map(category => (
                <PagedModal.Page
                    id={category}
                    title={category.toTitleCase()}
                    description={decideCategoryDescription(category)}
                    icon={Cog6ToothIcon}
                >
                    <PagedModal.Body>
                        <ServerConfigRender config={packSettingsCategories[category]}/>
                    </PagedModal.Body>
                </PagedModal.Page>
            ))}

            {/*<PagedModal.Page id="delete" title="Delete This Pack" description="Delete the pack and all data" icon={TrashIcon}>*/}
            {/*    <PagedModal.Body>*/}
            {/*        <ResourceDeletePage />*/}
            {/*    </PagedModal.Body>*/}
            {/*</PagedModal.Page>*/}
        </PagedModal>
    )
}
