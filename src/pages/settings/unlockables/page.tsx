import React, {useEffect, useState} from 'react'
import {Container} from '@/components/layout/container'
import {motion} from 'framer-motion'
import {Heading, Text} from '@/components/shared/text'
import {useUserAccountStore} from '@/lib/states'
import {BentoGenericUnlockableBadge} from '@/lib/utils/pak'
import badgeConfig from '@/datasets/bento/pak/badges/pak.json'
import {LockClosedIcon, TrophyIcon, UserCircleIcon} from '@heroicons/react/24/solid'
import {QuestionMarkCircleIcon} from '@heroicons/react/20/solid'
import {toast} from 'sonner'
import {CrawlText} from '@/components/shared/crawl-text'
import {vg} from '@/lib/api'

// We'll import the existing component since it's already well-designed for this purpose
// This is essentially a wrapper to make it fit nicely in our settings dialog
const UnlockableSettings: React.FC = () => {
    return (
        <div className="h-full overflow-y-auto">
            <div className="flex items-center justify-center p-6">
                <InviteFestivalIcon/>
                <Heading
                    size="2xl"
                    className="bg-gradient-to-r animate-logo-hue from-amber-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-orange-400"
                >
                    Invite Festival
                </Heading>
            </div>

            <React.Suspense fallback={
                <div className="flex h-96 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-amber-600"></div>
                </div>
            }>
                <TrophyCaseUnlockables/>
            </React.Suspense>
        </div>
    )
}

export default UnlockableSettings

const InviteFestivalIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 240 240"
        className="mr-3 inline-block h-10 w-10"
    >
        {/* Background circular glow */}
        <circle cx="120" cy="120" r="100" fill="url(#festivalGlow)"/>

        {/* Envelope Base */}
        <path d="M70 100 L120 130 L170 100 L170 160 L70 160 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M70 100 L120 130 L170 100 L170 90 L70 90 Z" fill="#fcd34d" stroke="#b45309" strokeWidth="3" strokeLinejoin="round"/>

        {/* Confetti Pieces */}
        <g id="confetti">
            {/* Left side confetti */}
            <rect x="45" y="70" width="8" height="18" rx="2" fill="#ec4899" transform="rotate(-30, 45, 70)"/>
            <rect x="60" y="60" width="6" height="14" rx="1" fill="#06b6d4" transform="rotate(25, 60, 60)"/>
            <rect x="55" y="95" width="7" height="16" rx="2" fill="#8b5cf6" transform="rotate(-15, 55, 95)"/>
            <circle cx="65" cy="80" r="4" fill="#f43f5e"/>
            <circle cx="50" cy="110" r="3" fill="#10b981"/>

            {/* Right side confetti */}
            <rect x="180" y="65" width="8" height="18" rx="2" fill="#f43f5e" transform="rotate(30, 180, 65)"/>
            <rect x="170" y="60" width="6" height="14" rx="1" fill="#8b5cf6" transform="rotate(-25, 170, 60)"/>
            <rect x="185" y="95" width="7" height="16" rx="2" fill="#06b6d4" transform="rotate(15, 185, 95)"/>
            <circle cx="175" cy="80" r="4" fill="#ec4899"/>
            <circle cx="190" cy="110" r="3" fill="#fcd34d"/>

            {/* Top confetti */}
            <rect x="105" y="40" width="8" height="18" rx="2" fill="#10b981" transform="rotate(15, 105, 40)"/>
            <rect x="125" y="45" width="7" height="16" rx="2" fill="#f43f5e" transform="rotate(-10, 125, 45)"/>
            <circle cx="115" cy="60" r="4" fill="#8b5cf6"/>
            <circle cx="135" cy="55" r="3" fill="#06b6d4"/>
        </g>

        {/* Ribbon on envelope */}
        <path d="M90 125 Q120 145 150 125" stroke="#ef4444" strokeWidth="5" fill="none"/>
        <circle cx="120" cy="125" r="10" fill="#ef4444"/>
        <path d="M115 125 L120 130 L125 125" fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>

        {/* Star bursts */}
        <g id="starbursts">
            <path d="M60 55 L63 63 L70 65 L63 67 L60 75 L57 67 L50 65 L57 63 Z" fill="#facc15"/>
            <path d="M180 55 L183 63 L190 65 L183 67 L180 75 L177 67 L170 65 L177 63 Z" fill="#facc15"/>
        </g>

        {/* Sparkle effects */}
        <g id="sparkles" fill="#fef3c7">
            <circle cx="85" cy="75" r="2"/>
            <circle cx="155" cy="75" r="2"/>
            <circle cx="50" cy="140" r="2"/>
            <circle cx="190" cy="140" r="2"/>
            <circle cx="70" cy="180" r="2"/>
            <circle cx="170" cy="180" r="2"/>
            <circle cx="120" cy="190" r="2"/>
        </g>

        {/* Party hat */}
        <path d="M130 70 L150 100 L110 100 Z" fill="#a855f7" stroke="#7e22ce" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M130 70 L130 100" stroke="#7e22ce" strokeWidth="1" strokeDasharray="3,2"/>
        <circle cx="130" cy="65" r="5" fill="#f43f5e"/>

        {/* Gradients and other defs */}
        <defs>
            <radialGradient id="festivalGlow" cx="120" cy="120" r="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffe4b5" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#ffe4b5" stopOpacity="0"/>
            </radialGradient>
        </defs>
    </svg>
)

// Trophy Case Display component with shelves and glass effect
const TrophyCase = ({children, title}) => {
    return (
        <div className="relative mt-8">
            {/* Trophy case header with wood texture */}
            <div className="relative z-10 rounded-t-xl bg-gradient-to-r from-amber-800 to-amber-700 p-4 text-center shadow-md">
                <div className="absolute inset-0 opacity-10 mix-blend-overlay"
                     style={{
                         backgroundImage: `url("data:image/svg+xml,%3Csvg width='42' height='44' viewBox='0 0 42 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 0h42v44H0V0zm1 1h40v20H1V1zM0 23h20v20H0V23zm22 0h20v20H22V23z'/%3E%3C/g%3E%3C/svg%3E")`,
                         backgroundSize: '50px 50px'
                     }}
                />
                <Heading className="text-amber-100">{title}</Heading>
            </div>

            {/* Trophy case body with wooden frame */}
            <div className="relative rounded-b-xl border-8 border-t-0 border-amber-700 bg-amber-800">
                {/* Inner case with texture */}
                <div className="relative bg-gradient-to-b from-amber-100 to-amber-200 p-1 dark:from-zinc-800 dark:to-zinc-900">
                    {/* Wood grain texture overlay */}
                    <div className="absolute inset-0 opacity-5 mix-blend-overlay"
                         style={{
                             backgroundImage: `url("data:image/svg+xml,%3Csvg width='42' height='44' viewBox='0 0 42 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 0h42v44H0V0zm1 1h40v20H1V1zM0 23h20v20H0V23zm22 0h20v20H22V23z'/%3E%3C/g%3E%3C/svg%3E")`,
                             backgroundSize: '50px 50px'
                         }}
                    />

                    {/* Glass effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"/>

                    {/* Trophy case content */}
                    <div className="relative z-10 p-4">
                        {children}
                    </div>
                </div>

                {/* Screws in corners for decoration */}
                {/*<div className="absolute -left-3 -top-3 h-4 w-4 rounded-full bg-white dark:bg-zinc-900"/>*/}
                {/*<div className="absolute -right-3 -top-3 h-4 w-4 rounded-full bg-white dark:bg-zinc-900"/>*/}
                {/*<div className="absolute -left-3 -bottom-3 h-4 w-4 rounded-full bg-white dark:bg-zinc-900"/>*/}
                {/*<div className="absolute -right-3 -bottom-3 h-4 w-4 rounded-full bg-white dark:bg-zinc-900"/>*/}
            </div>
        </div>
    )
}

// Trophy shelf component
const TrophyShelf = ({title, children, featured = false}) => {
    return (
        <div className={`mb-8 ${featured ? 'relative z-10' : ''}`}>
            {/* Shelf label */}
            <div className="mb-2 flex items-center">
                <div className="h-px flex-grow bg-amber-800/30 dark:bg-zinc-600/50"/>
                <Text className={`mx-3 text-sm font-bold uppercase tracking-widest ${featured ? 'text-amber-800 dark:text-amber-400' : 'text-zinc-500'}`}>
                    {title}
                </Text>
                <div className="h-px flex-grow bg-amber-800/30 dark:bg-zinc-600/50"/>
            </div>

            {/* Shelf content */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {children}
            </div>

            {/* Shelf display stand with shadow */}
            <div className="relative mt-2 h-2 rounded-full bg-amber-800/20 dark:bg-zinc-700/20 shadow-md"/>
        </div>
    )
}

// Badge trophy display with stand
const BadgeTrophy = ({badge, isSelected, locked = false, onSelect}) => {
    const [isHovered, setIsHovered] = useState(false)
    const badgeDescription = badgeConfig.config.unlockables.tooltip[badge.type] || 'Mystery Badge'

    // Badge pedestal styles
    const baseStyles = locked
        ? 'border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800'
        : isSelected
            ? 'border-amber-500 bg-amber-100 dark:border-amber-500 dark:bg-amber-900/30'
            : 'border-zinc-200 bg-white hover:border-amber-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-amber-600'

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4}}
            whileHover={!locked ? {
                y: -5,
                transition: {duration: 0.2}
            } : {}}
            className={`relative cursor-pointer select-none overflow-hidden text-center ${locked ? 'opacity-60' : ''}`}
            onClick={() => !locked && onSelect(badge)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Trophy pedestal with glass dome effect */}
            <div className={`relative mx-auto flex h-28 w-24 flex-col items-center justify-center rounded-lg border-2 p-3 shadow-md ${baseStyles}`}>
                {/* Badge display */}
                <div className="relative">
                    {locked ? (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-300 dark:bg-zinc-700">
                            <LockClosedIcon className="h-8 w-8 text-zinc-500 dark:text-zinc-500"/>
                        </div>
                    ) : (
                        <motion.div
                            animate={isHovered || isSelected ? {
                                y: [0, -5, 0],
                                rotate: [0, -5, 5, 0]
                            } : {}}
                            transition={{
                                duration: 0.8,
                                ease: 'easeInOut'
                            }}
                        >
                            <BentoGenericUnlockableBadge type={badge.type} className="h-16 w-16"/>
                        </motion.div>
                    )}

                    {/* Glass dome reflection effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none"/>
                </div>

                {/* Trophy pedestal base */}
                <div className={`absolute bottom-0 h-5 w-full rounded-b-lg ${
                    isSelected
                        ? 'bg-amber-200 dark:bg-amber-800/30'
                        : 'bg-zinc-100 dark:bg-zinc-700'
                }`}/>

                {/* Selection indicator */}
                {isSelected && !locked && (
                    <motion.div
                        initial={{scale: 0}}
                        animate={{scale: 1}}
                        className="absolute -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-white shadow-lg dark:border-zinc-800"
                    >
                        <UserCircleIcon className="h-4 w-4"/>
                    </motion.div>
                )}
            </div>

            {/* Badge name */}
            <Text className={`mt-2 truncate text-xs ${
                isSelected && !locked
                    ? 'font-bold text-amber-800 dark:text-amber-400'
                    : 'text-zinc-600 dark:text-zinc-400'
            }`}>
                {locked ? 'Locked' : badgeDescription}
            </Text>
        </motion.div>
    )
}

// Progress display with level indicators
const ProgressDisplay = ({value}) => {
    // For animation sequence
    const [animatedValue, setAnimatedValue] = useState(0)

    useEffect(() => {
        // Animate progress value
        const interval = setInterval(() => {
            setAnimatedValue(prev => {
                if (prev < value) return prev + 1
                clearInterval(interval)
                return prev
            })
        }, 30)

        return () => clearInterval(interval)
    }, [value])

    // Calculate which milestone badges are earned
    const milestones = [
        {value: 15, label: 'Bronze', earned: value >= 15},
        {value: 20, label: 'Silver', earned: value >= 20},
        {value: 30, label: 'Gold', earned: value >= 30}
    ]

    return (
        <div className="relative overflow-hidden rounded-xl border-8 border-amber-700 bg-amber-100 p-6 dark:bg-zinc-800">
            {/* Wood grain texture overlay */}
            <div className="absolute inset-0 opacity-5 mix-blend-overlay"
                 style={{
                     backgroundImage: `url("data:image/svg+xml,%3Csvg width='42' height='44' viewBox='0 0 42 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 0h42v44H0V0zm1 1h40v20H1V1zM0 23h20v20H0V23zm22 0h20v20H22V23z'/%3E%3C/g%3E%3C/svg%3E")`,
                     backgroundSize: '50px 50px'
                 }}
            />

            {/* Reflective overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"/>

            <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrophyIcon className="h-6 w-6 text-amber-600 dark:text-amber-500"/>
                        <Heading>Trophy Case Level</Heading>
                    </div>

                    <div className="flex items-baseline space-x-2">
                        <Text className="text-zinc-500 dark:text-zinc-400">Invited:</Text>
                        <Text className="text-xl font-bold text-amber-600 dark:text-amber-400">{animatedValue}</Text>
                    </div>
                </div>

                {/* Progress path with achievements */}
                <div className="relative mb-12 mt-8">
                    {/* Path line */}
                    <div className="absolute top-4 h-1 w-full rounded-full bg-zinc-300 dark:bg-zinc-600"/>

                    {/* Progress fill */}
                    <motion.div
                        initial={{width: 0}}
                        animate={{width: `${Math.min((animatedValue / 30) * 100, 100)}%`}}
                        transition={{duration: 1, ease: 'easeOut'}}
                        className="absolute top-4 h-1 rounded-full bg-amber-500"
                    />

                    {/* Milestone markers */}
                    <div className="relative flex justify-between -mx-1">
                        {/* Starting point */}
                        <div className="flex flex-col items-center mr-[calc(100%/4)]">
                            <motion.div
                                initial={{scale: 0}}
                                animate={{scale: 1}}
                                transition={{delay: 0.2}}
                                className="z-10 h-8 w-8 rounded-full bg-amber-500 p-1"
                            >
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-amber-600 dark:bg-zinc-900 dark:text-amber-400">
                                    <TrophyIcon className="h-4 w-4"/>
                                </div>
                            </motion.div>
                            <Text className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">Start</Text>
                        </div>

                        {/* Milestone markers */}
                        {milestones.map((milestone, index) => (
                            <div key={milestone.value} className="flex flex-col items-center">
                                <motion.div
                                    initial={{scale: 0}}
                                    animate={{scale: milestone.earned ? 1 : 0.8}}
                                    transition={{
                                        delay: milestone.earned ? 0.3 + (index * 0.2) : 0,
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 30
                                    }}
                                    className={`z-10 flex h-8 w-8 items-center justify-center rounded-full p-1 ${
                                        milestone.earned
                                            ? 'bg-amber-500'
                                            : 'bg-zinc-300 dark:bg-zinc-600'
                                    }`}
                                >
                                    <div className={`flex h-full w-full items-center justify-center rounded-full text-xs font-bold ${
                                        milestone.earned
                                            ? 'bg-white text-amber-600 dark:bg-zinc-900 dark:text-amber-400'
                                            : 'bg-white text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                                    }`}>
                                        {milestone.value}
                                    </div>
                                </motion.div>
                                <Text className={`mt-2 text-xs font-medium ${
                                    milestone.earned
                                        ? 'text-amber-700 dark:text-amber-400'
                                        : 'text-zinc-500 dark:text-zinc-400'
                                }`}>{milestone.label}</Text>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Current level status */}
                <div className="rounded-lg bg-white/50 p-4 dark:bg-zinc-700/40">
                    <Text className="font-medium">
                        Current Level: {
                        value >= 30 ? 'Gold Collector' :
                            value >= 20 ? 'Silver Collector' :
                                value >= 15 ? 'Bronze Collector' :
                                    'Novice Collector'
                    }
                    </Text>
                    {value < 30 ? (
                        <Text alt className="mt-1 text-sm">
                            Next tier: {
                            value < 15 ? `Bronze (${15 - value} more invites needed)` :
                                value < 20 ? `Silver (${20 - value} more invites needed)` :
                                    `Gold (${30 - value} more invites needed)`
                        }
                        </Text>
                    ) : (
                        <Text className="mt-1 text-sm animate-logo-hue text-amber-600 dark:text-amber-400">
                            From the bottom of our hearts, thank you. We are eternally grateful for your contributions to the Packbase community, and
                            forever indebted to you. We hope you enjoy Packbase!
                            <br/><br/>
                            'Til next time,
                            <br/>
                            Rek & the Packbase Team
                        </Text>
                    )}
                </div>
            </div>
        </div>
    )
}

// Main Unlockables Trophy Case component
function TrophyCaseUnlockables() {
    const {user} = useUserAccountStore()
    const [selectedBadge, setSelectedBadge] = useState(null)
    const [isUpdatingBadge, setIsUpdatingBadge] = useState(false)
    const invitedCount = user?.metadata?.invited || 0

    // Available badges based on user's unlocked content
    const availableBadges = React.useMemo(() => {
        return (Object.keys(badgeConfig.config.unlockables.tooltip) || [])
            .filter(badge => (user?.metadata?.unlockables || []).includes(badge))
            .map((badge, index) => ({id: index + 1, type: badge}))
    }, [user?.metadata?.unlockables])

    // All possible badges to show locked ones
    const allBadges = React.useMemo(() => {
        const unlocked = new Set((user?.metadata?.unlockables || []))
        return (Object.keys(badgeConfig.config.unlockables.tooltip) || [])
            .map((badge, index) => ({
                id: index + 1,
                type: badge,
                locked: !unlocked.has(badge)
            }))
    }, [user?.metadata?.unlockables])

    // Group badges by type/tier
    const specialBadges = allBadges.filter(badge =>
        badge.type.includes('cat_invite_13') ||
        badge.type.includes('cat_invite_14') ||
        badge.type.includes('cat_invite_15')
    )

    const regularBadges = allBadges.filter(badge =>
        !specialBadges.some(special => special.type === badge.type)
    )

    // Initialize selected badge based on user's current badge
    useEffect(() => {
        const currentBadge = availableBadges.find(badge => badge.type === user?.metadata?.badge)
        setSelectedBadge(currentBadge || (availableBadges.length > 0 ? availableBadges[0] : null))
    }, [availableBadges, user?.metadata?.badge])

    // Handle badge selection
    const handleBadgeSelect = (badge) => {
        if (badge.locked) return
        if (selectedBadge?.id === badge.id) return
        setSelectedBadge(badge)
        updateUserBadge(badge.type)
    }

    // Update the user's badge in Supabase
    const updateUserBadge = (badgeType) => {
        setIsUpdatingBadge(true)
        vg.user.me.badge.post({
            badge: badgeType
        }).then(({error}) => {
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

            {/* Trophy Case for premium badges */}
            {specialBadges.some(badge => !badge.locked) && (
                <TrophyCase title="Premium Collection">
                    <TrophyShelf title="Special Achievements" featured={true}>
                        {specialBadges.map((badge) => (
                            <BadgeTrophy
                                key={badge.id}
                                badge={badge}
                                locked={badge.locked}
                                isSelected={!badge.locked && selectedBadge?.type === badge.type}
                                onSelect={handleBadgeSelect}
                            />
                        ))}
                    </TrophyShelf>
                </TrophyCase>
            )}

            {/* Main Trophy Case */}
            <TrophyCase title="Badge Collection">
                {regularBadges.length > 0 ? (
                    <TrophyShelf title="Standard Badges">
                        {regularBadges.map((badge) => (
                            <BadgeTrophy
                                key={badge.id}
                                badge={badge}
                                locked={badge.locked}
                                isSelected={!badge.locked && selectedBadge?.type === badge.type}
                                onSelect={handleBadgeSelect}
                            />
                        ))}
                    </TrophyShelf>
                ) : (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                                rotate: [0, 5, 0, -5, 0]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: 'loop'
                            }}
                            className="mb-4 rounded-full bg-amber-100 p-5 dark:bg-amber-900/30"
                        >
                            <QuestionMarkCircleIcon className="h-10 w-10 text-amber-600 dark:text-amber-400"/>
                        </motion.div>
                        <Text className="max-w-md text-zinc-600 dark:text-zinc-400">
                            Your trophy case is empty! Invite friends to Packbase to earn your first badge and start building your collection.
                        </Text>
                    </motion.div>
                )}
            </TrophyCase>

            {/* Instructions for badge selection */}
            {availableBadges.length > 0 && (
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.5}}
                    className="mt-6 rounded-lg bg-amber-50 p-4 text-center dark:bg-amber-900/20"
                >
                    <Text className="text-sm">
                        <TrophyIcon className="mr-1 inline h-4 w-4"/>
                        Click on an unlocked badge to display it on your profile.
                        {isUpdatingBadge && ' Updating...'}
                    </Text>
                </motion.div>
            )}
        </Container>
    )
}