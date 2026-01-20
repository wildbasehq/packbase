/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import ResourceSettingsMembers from '@/components/layout/resource/pages/members'
import ResourceSettingsTheme from '@/components/layout/resource/pages/theme'
import {Avatar} from '@/components/shared/avatar'
import PagedModal from '@/components/shared/paged-modal'
import {Heading, Text} from '@/components/shared/text'
import {useResourceStore} from '@/lib/state'
import {SwatchIcon} from '@heroicons/react/16/solid'
import {ClipboardIcon, UserGroupIcon} from '@heroicons/react/20/solid'
import ResourceSettingsGeneral from './pages/general'

export function ResourceSettingsModal() {
    const {currentResource} = useResourceStore()

    // Create the resource profile footer component
    const ResourceProfileFooter = (
        <div className="flex items-center">
            <Avatar
                square
                className="w-12 h-12"
                initials={currentResource?.display_name?.charAt(0)}
                alt={currentResource?.display_name}
                src={currentResource?.images?.avatar}
            />
            <div className="ml-3 grow">
                <Heading>{currentResource?.display_name || currentResource?.slug}</Heading>
                <Text alt>{currentResource?.slug}</Text>
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

            {/*<PagedModal.Page id="delete" title="Delete This Pack" description="Delete the pack and all data" icon={TrashIcon}>*/}
            {/*    <PagedModal.Body>*/}
            {/*        <ResourceDeletePage />*/}
            {/*    </PagedModal.Body>*/}
            {/*</PagedModal.Page>*/}
        </PagedModal>
    )
}
