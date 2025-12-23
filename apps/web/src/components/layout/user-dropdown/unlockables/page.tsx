import {Container} from '@/components/layout/container'
import {Badge} from '@/components/shared/badge'
import Card from '@/components/shared/card'
import {Heading, Text} from '@/components/shared/text'
import badgeConfig from '@/datasets/bento/pak/badges/pak.json'
import {useUserAccountStore} from '@/lib'
import {vg} from '@/lib/api'
import {BentoGenericUnlockableBadge} from '@/lib/utils/pak'
import {QuestionMarkCircleIcon} from '@heroicons/react/20/solid'
import {CheckCircleIcon, LockClosedIcon, TrophyIcon} from '@heroicons/react/24/solid'
import {motion} from 'motion/react'
import {FC, Suspense, useEffect, useMemo, useState} from 'react'
import {toast} from 'sonner'

// We'll import the existing component since it's already well-designed for this purpose
// This is essentially a wrapper to make it fit nicely in our settings dialog
const UnlockableSettings: FC = () => {
    return (
        <div className="h-full overflow-y-auto">
            <Suspense
                fallback={
                    <div className="flex h-96 items-center justify-center">
                        <div
                            className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600"></div>
                    </div>
                }
            >
                <TrophyCaseUnlockables/>
            </Suspense>
        </div>
    )
}

export default UnlockableSettings

// Simple card wrapper for sections
const BadgeSection = ({children, title}) => {
    return (
        <Card className="mt-6">
            <div className="mb-4">
                <Heading className="text-lg">{title}</Heading>
            </div>
            {children}
        </Card>
    )
}

// Clean section header
const SectionHeader = ({title, featured = false}) => {
    return (
        <div className="mb-4">
            <Heading
                className={`text-base ${featured ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                {title}
            </Heading>
            <div className="mt-2 h-px bg-border"/>
        </div>
    )
}

// Clean badge card display
const BadgeCard = ({badge, isSelected, locked = false, onSelect}) => {
    const badgeDescription = badgeConfig.config.unlockables.tooltip[badge.type] || 'Mystery Badge'

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.2}}
            whileHover={!locked ? {y: -2} : {}}
            className={`relative cursor-pointer transition-all ${locked ? 'opacity-50' : ''}`}
            onClick={() => !locked && onSelect(badge)}
        >
            <Card
                className={`p-4 text-center transition-all ${
                    locked ? 'bg-muted' : isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-muted/50'
                }`}
            >
                {/* Badge display */}
                <div className="flex justify-center mb-3">
                    {locked ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/20">
                            <LockClosedIcon className="h-6 w-6 text-muted-foreground"/>
                        </div>
                    ) : (
                        <BentoGenericUnlockableBadge type={badge.type} className="h-12 w-12"/>
                    )}
                </div>

                {/* Badge name */}
                <Text
                    className={`text-xs ${isSelected && !locked ? 'font-semibold' : ''}`}>{locked ? 'Locked' : badgeDescription}</Text>

                {/* Selection indicator */}
                {isSelected && !locked && (
                    <div className="absolute top-2 right-2">
                        <CheckCircleIcon className="h-4 w-4 text-blue-600"/>
                    </div>
                )}
            </Card>
        </motion.div>
    )
}

// Clean progress display
const ProgressDisplay = ({value}) => {
    const [animatedValue, setAnimatedValue] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedValue(value), 100)
        return () => clearTimeout(timer)
    }, [value])

    const milestones = [
        {value: 15, label: 'Bronze', color: 'amber'},
        {value: 20, label: 'Silver', color: 'zinc'},
        {value: 30, label: 'Gold', color: 'yellow'},
    ]

    const currentLevel =
        value >= 30 ? 'Gold Collector' : value >= 20 ? 'Silver Collector' : value >= 15 ? 'Bronze Collector' : 'Novice Collector'

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 text-muted-foreground"/>
                    <Heading>Progress Overview</Heading>
                </div>
                <div className="text-right">
                    <Text className="text-sm text-muted-foreground">Invited Users</Text>
                    <Text className="text-2xl font-bold">{animatedValue}</Text>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
                <div className="flex justify-between mb-2">
                    <Text className="text-sm font-medium">Current Level: {currentLevel}</Text>
                    <Text
                        className="text-sm text-muted-foreground">{Math.min((value / 30) * 100, 100).toFixed(0)}%</Text>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                        initial={{width: 0}}
                        animate={{width: `${Math.min((animatedValue / 30) * 100, 100)}%`}}
                        transition={{duration: 1, ease: 'easeOut'}}
                        className="bg-blue-600 h-2 rounded-full"
                    />
                </div>
            </div>

            {/* Milestones */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {milestones.map(milestone => (
                    <div key={milestone.value} className="text-center">
                        {/* @ts-ignore */}
                        <Badge color={value >= milestone.value ? milestone.color : 'zinc'}>{milestone.label}</Badge>
                        <Text className="text-xs text-muted-foreground mt-1">{milestone.value} invites</Text>
                    </div>
                ))}
            </div>

            {/* Next tier info */}
            {value < 30 ? (
                <div className="bg-muted rounded-lg p-4">
                    <Text className="text-sm">
                        Next tier:{' '}
                        {value < 15
                            ? `Bronze (${15 - value} more invites needed)`
                            : value < 20
                                ? `Silver (${20 - value} more invites needed)`
                                : `Gold (${30 - value} more invites needed)`}
                    </Text>
                </div>
            ) : (
                <div
                    className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-lg p-4">
                    <Text className="text-sm">
                        From the bottom of our hearts, thank you. We are eternally grateful for your contributions to
                        the Packbase
                        community, and forever indebted to you. We hope you enjoy Packbase!
                        <br/>
                        <br/>
                        'Til next time,
                        <br/>
                        Rek & the Packbase Team
                    </Text>
                </div>
            )}
        </Card>
    )
}

// Main Unlockables component with clean design
function TrophyCaseUnlockables() {
    const {user} = useUserAccountStore()
    const [selectedBadge, setSelectedBadge] = useState(null)
    const [isUpdatingBadge, setIsUpdatingBadge] = useState(false)
    const invitedCount = user?.metadata?.invited || 0

    // Available badges based on user's unlocked content
    const availableBadges = useMemo(() => {
        return (Object.keys(badgeConfig.config.unlockables.tooltip) || [])
            .filter(badge => (user?.metadata?.unlockables || []).includes(badge))
            .map((badge, index) => ({id: index + 1, type: badge}))
    }, [user?.metadata?.unlockables])

    // All possible badges to show locked ones
    const allBadges = useMemo(() => {
        const unlocked = new Set(user?.metadata?.unlockables || [])
        return (Object.keys(badgeConfig.config.unlockables.tooltip) || []).map((badge, index) => ({
            id: index + 1,
            type: badge,
            locked: !unlocked.has(badge),
        }))
    }, [user?.metadata?.unlockables])

    // Group badges by type/tier
    const specialBadges = allBadges.filter(
        badge => badge.type.includes('cat_invite_13') || badge.type.includes('cat_invite_14') || badge.type.includes('cat_invite_15')
    )

    const regularBadges = allBadges.filter(badge => !specialBadges.some(special => special.type === badge.type))

    // Initialize selected badge based on user's current badge
    useEffect(() => {
        const currentBadge = availableBadges.find(badge => badge.type === user?.metadata?.badge)
        setSelectedBadge(currentBadge || (availableBadges.length > 0 ? availableBadges[0] : null))
    }, [availableBadges, user?.metadata?.badge])

    // Handle badge selection
    const handleBadgeSelect = badge => {
        if (badge.locked) return
        setSelectedBadge(badge)
        updateUserBadge(badge.type)
    }

    // Update the user's badge in Supabase
    const updateUserBadge = badgeType => {
        setIsUpdatingBadge(true)
        vg.user.me.badge
            .post({
                badge: badgeType,
            })
            .then(({error}) => {
                setIsUpdatingBadge(false)
                if (error) {
                    toast.error('Failed to update badge')
                } else {
                    toast.success('Badge updated successfully!')
                }
            })
    }

    return (
        <Container>
            {/* Progress display */}
            <ProgressDisplay value={invitedCount}/>

            {/* Special badges section */}
            {specialBadges.some(badge => !badge.locked) && (
                <BadgeSection title="Premium Collection">
                    <SectionHeader title="Special Achievements" featured={true}/>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {specialBadges.map(badge => (
                            <BadgeCard
                                key={badge.id}
                                badge={badge}
                                locked={badge.locked}
                                isSelected={!badge.locked && selectedBadge?.type === badge.type}
                                onSelect={handleBadgeSelect}
                            />
                        ))}
                    </div>
                </BadgeSection>
            )}

            {/* Regular badges section */}
            <BadgeSection title="Badge Collection">
                {regularBadges.length > 0 ? (
                    <>
                        <SectionHeader title="Available Badges"/>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {regularBadges.map(badge => (
                                <BadgeCard
                                    key={badge.id}
                                    badge={badge}
                                    locked={badge.locked}
                                    isSelected={!badge.locked && selectedBadge?.type === badge.type}
                                    onSelect={handleBadgeSelect}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 rounded-full bg-muted p-5">
                            <QuestionMarkCircleIcon className="h-10 w-10 text-muted-foreground"/>
                        </div>
                        <Text className="max-w-md text-muted-foreground">
                            Your badge collection is empty! Invite friends to Packbase to earn your first badge and
                            start building your
                            collection.
                        </Text>
                    </div>
                )}
            </BadgeSection>

            {/* Instructions */}
            {availableBadges.length > 0 && (
                <Card className="mt-6">
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-center">
                        <Text className="text-sm flex items-center justify-center gap-2">
                            <TrophyIcon className="h-4 w-4"/>
                            Click on an unlocked badge to display it on your profile.
                            {isUpdatingBadge && <span className="text-blue-600">Updating...</span>}
                        </Text>
                    </div>
                </Card>
            )}
        </Container>
    )
}
