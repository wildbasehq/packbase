import React, {useEffect, useState} from 'react'
import {Heading, Text} from '@/components/shared/text.tsx'
import {Container} from '@/components/layout/container.tsx'
import {CheckCircleIcon} from '@heroicons/react/20/solid'
import {useUserAccountStore} from '@/lib/states.ts'
import {BentoGenericUnlockableBadge} from '@/lib/utils/pak.tsx'
import {supabase} from '@/lib/api'
import badgeConfig from '@/datasets/bento/pak/badges/pak.json'

// Dummy data for badges and names
const unlockables = {
    badges: [
        // 15 times
        {id: 1, type: 'cat_invite_1'},
        {id: 2, type: 'cat_invite_2'},
        {id: 3, type: 'cat_invite_3'},
        {id: 4, type: 'cat_invite_4'},
        {id: 5, type: 'cat_invite_5'},
        {id: 6, type: 'cat_invite_6'},
        {id: 7, type: 'cat_invite_7'},
        {id: 8, type: 'cat_invite_8'},
        {id: 9, type: 'cat_invite_9'},
        {id: 10, type: 'cat_invite_10'},
        {id: 11, type: 'cat_invite_11'},
        {id: 12, type: 'cat_invite_12'},
        {id: 13, type: 'cat_invite_13'},
        {id: 14, type: 'cat_invite_14'},
        {id: 15, type: 'cat_invite_15'},
    ],
    names: []
}

const ProgressBar = ({value}) => {
    const getColor = () => {
        if (value >= 30) return 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500'
        if (value >= 20) return 'bg-green-500'
        if (value >= 15) return 'bg-blue-500'
        return 'bg-gray-300'
    }

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
                <Text>Progress: {value} invite</Text>
                <div className="space-x-4">
                    <Text alt className="inline-flex">Special badges at</Text>
                    <span className="text-blue-500">15</span>
                    <span className="text-green-500">20</span>
                    <span className="text-pink-500">30</span>
                </div>
            </div>
            <div className="h-2 bg-card border rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor()} transition-all duration-300 rounded-full`}
                    style={{width: `${Math.min((value / 30) * 100, 100)}%`}}
                />
            </div>
        </div>
    )
}

const UnlockableItem = ({item, isSelected, onSelect}) => {
    return (
        <div
            onClick={() => onSelect(item)}
            className={`p-4 !min-h-32 rounded-lg border-2 transition-all duration-200 ${
                isSelected
                    ? 'border-primary bg-sidebar'
                    : 'border hover:border-primary'
            }`}
        >
            <div className="flex flex-col items-center space-y-2">
                <BentoGenericUnlockableBadge type={item.type} className="w-16 h-16"/>
                <div className="text-sm font-medium">{badgeConfig.config.unlockables.tooltip[item.type]}</div>
                {isSelected && (
                    <CheckCircleIcon className="w-5 h-5 text-primary"/>
                )}
            </div>
        </div>
    )
}

export default function SettingsUnlockablesPage() {
    const {user} = useUserAccountStore()
    const [selectedBadge, setSelectedBadge] = useState(unlockables.badges.find((badge) => badge.type === user.metadata.badge))
    // const [selectedName, setSelectedName] = useState(null)
    const dummyProgress = 22 // Dummy progress value

    useEffect(() => {
        log.info('Unlockable', 'Updating user badge:', selectedBadge)
        supabase.auth.updateUser({
            data: {
                badge: selectedBadge?.type
            }
        }).catch(e => {
            log.error('Theme', 'Failed to update user theme:', e)
        })
    }, [selectedBadge])

    return (
        <Container>
            <div className="flex flex-col gap-8">
                <div>
                    <Heading>Unlockables</Heading>
                    <Text alt>
                        All your unlockable content, and ones you're working towards!
                    </Text>
                </div>

                <ProgressBar value={user.metadata.invites_total}/>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Badges</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {unlockables.badges.filter((badge) => (user.metadata.unlockables || []).includes(badge.type)).map((badge) => (
                                <UnlockableItem
                                    key={badge.id}
                                    item={badge}
                                    isSelected={selectedBadge?.id === badge.id}
                                    onSelect={setSelectedBadge}
                                />
                            ))}
                        </div>
                    </div>

                    {/*<div>*/}
                    {/*    <h2 className="text-xl font-semibold mb-4">Display Names</h2>*/}
                    {/*    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">*/}
                    {/*        {dummyUnlockables.names.map((name) => (*/}
                    {/*            <UnlockableItem*/}
                    {/*                key={name.id}*/}
                    {/*                item={name}*/}
                    {/*                isSelected={selectedName?.id === name.id}*/}
                    {/*                onSelect={handleSelect}*/}
                    {/*            />*/}
                    {/*        ))}*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>
            </div>
        </Container>
    )
}