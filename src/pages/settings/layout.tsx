import React, { useEffect } from 'react'
import { useUserAccountStore } from '@/lib/index'
import { EnvelopeIcon, EnvelopeOpenIcon, IdentificationIcon, SwatchIcon, TrophyIcon } from '@heroicons/react/16/solid'

// Import all settings pages
import ProfileSettings from './general/page'
import TemplateSettings from './template/page'
import InviteSettings from './invite/page'
import UnlockableSettings from './unlockables/page'
import AnonUserSettings from './anon-user/page'
import { Text } from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import { TrashIcon } from '@heroicons/react/20/solid'
import SettingsDeleteAccount from './delete/page'
import PagedModal from '@/components/shared/paged-modal'

const SettingsDialog: React.FC = () => {
    const { user } = useUserAccountStore()

    // Create the user profile footer component
    const UserProfileFooter = (
        <div className="flex items-center">
            <UserAvatar user={user} size="lg" />
            <div className="ml-2">
                <Text className="text-sm font-medium">{user?.display_name || user?.username || 'Anonymous User'}</Text>
                <Text className="text-xs text-alt">{user?.anonUser ? 'Not registered yet' : `@${user?.username}`}</Text>
            </div>
        </div>
    )

    // Render content based on user state
    if (!user) return null

    // For anonymous users, show only the invite page
    if (user.anonUser) {
        return (
            <PagedModal footer={UserProfileFooter}>
                <PagedModal.Page 
                    id="invite"
                    title="Enter Invite" 
                    icon={EnvelopeIcon}
                >
                    <AnonUserSettings />
                </PagedModal.Page>
            </PagedModal>
        )
    }

    // For registered users, show all pages
    return (
        <PagedModal footer={UserProfileFooter}>
            <PagedModal.Page 
                id="profile"
                title="Public Information" 
                icon={IdentificationIcon}
            >
                <ProfileSettings />
            </PagedModal.Page>

            <PagedModal.Page 
                id="template"
                title="Template" 
                icon={SwatchIcon}
            >
                <TemplateSettings />
            </PagedModal.Page>

            <PagedModal.Page 
                id="invite"
                title="Invite" 
                icon={EnvelopeOpenIcon}
                description="Invite a friend to join the community"
            >
                <InviteSettings />
            </PagedModal.Page>

            <PagedModal.Page 
                id="unlockables"
                title="Events" 
                icon={TrophyIcon}
                description="Invite your friends to join the community and unlock special rewards!"
                badge="Limited Event"
            >
                <UnlockableSettings />
            </PagedModal.Page>

            <PagedModal.Page 
                id="delete"
                title="Delete Account" 
                icon={TrashIcon}
                description="Delete your account and all associated data"
            >
                <SettingsDeleteAccount />
            </PagedModal.Page>
        </PagedModal>
    )
}

export default SettingsDialog
