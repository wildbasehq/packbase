/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {Heading, Text} from '@/components/shared/text'
import {useResourceStore} from '@/lib/state'
import {ClipboardIcon, Cog6ToothIcon, UserGroupIcon} from '@heroicons/react/20/solid'
import {Avatar} from '@/components/shared/avatar'
import ResourceSettingsGeneral from './pages/general'
import ResourceSettingsMembers from '@/components/layout/resource/pages/members.tsx'
import PagedModal from '@/components/shared/paged-modal'
import ResourceSettingsTheme from '@/components/layout/resource/pages/theme.tsx'
import {SwatchIcon} from '@heroicons/react/16/solid'
import {useContentFrame} from '@/src/components'
import ServerConfigRender, {decideCategoryDescription} from '@/components/shared/input/server-config-render.tsx'

export function ResourceSettingsModal() {
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
                        <ServerConfigRender config={packSettingsCategories[category]}
                                            updateEndpoint={`pack/${currentResource.id}/settings`}/>
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
