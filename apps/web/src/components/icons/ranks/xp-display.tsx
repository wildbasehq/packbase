import UnrankedIcon from '@/components/icons/ranks/rank-none'
import ProgressBar from '@/components/shared/progress-bar'
import {cn} from '@/lib'
import {lazy} from 'react'

const BASE_XP = 100
const EXPONENT = 1.5
const LEVELS_PER_RANK = 6

const RANKS = [
    'Bronze',
    'Silver',
    'Gold',
    'Platinum',
    'Ruby',
    'Amethyst',
    'Onyx',
    'Master'
]

const RANKS_ICONS = {
    'Bronze': {
        1: lazy(() => import('@/components/icons/ranks/rank-bronze-1')),
        2: lazy(() => import('@/components/icons/ranks/rank-bronze-2')),
        3: lazy(() => import('@/components/icons/ranks/rank-bronze-3')),
        4: lazy(() => import('@/components/icons/ranks/rank-bronze-4')),
        5: lazy(() => import('@/components/icons/ranks/rank-bronze-5')),
        6: lazy(() => import('@/components/icons/ranks/rank-bronze-6'))
    },
    'Silver': {
        1: lazy(() => import('@/components/icons/ranks/rank-silver-1')),
        2: lazy(() => import('@/components/icons/ranks/rank-silver-2')),
        3: lazy(() => import('@/components/icons/ranks/rank-silver-3')),
        4: lazy(() => import('@/components/icons/ranks/rank-silver-4')),
        5: lazy(() => import('@/components/icons/ranks/rank-silver-5')),
        6: lazy(() => import('@/components/icons/ranks/rank-silver-6'))
    },
    'Gold': {
        1: lazy(() => import('@/components/icons/ranks/rank-gold-1')),
        2: lazy(() => import('@/components/icons/ranks/rank-gold-2')),
        3: lazy(() => import('@/components/icons/ranks/rank-gold-3')),
        4: lazy(() => import('@/components/icons/ranks/rank-gold-4')),
        5: lazy(() => import('@/components/icons/ranks/rank-gold-5')),
        6: lazy(() => import('@/components/icons/ranks/rank-gold-6'))
    },
    'Platinum': {
        1: lazy(() => import('@/components/icons/ranks/rank-platinum-1')),
        2: lazy(() => import('@/components/icons/ranks/rank-platinum-2')),
        3: lazy(() => import('@/components/icons/ranks/rank-platinum-3')),
        4: lazy(() => import('@/components/icons/ranks/rank-platinum-4')),
        5: lazy(() => import('@/components/icons/ranks/rank-platinum-5')),
        6: lazy(() => import('@/components/icons/ranks/rank-platinum-6'))
    },
    'Ruby': {
        1: lazy(() => import('@/components/icons/ranks/rank-ruby-1')),
        2: lazy(() => import('@/components/icons/ranks/rank-ruby-2')),
        3: lazy(() => import('@/components/icons/ranks/rank-ruby-3')),
        4: lazy(() => import('@/components/icons/ranks/rank-ruby-4')),
        5: lazy(() => import('@/components/icons/ranks/rank-ruby-5')),
        6: lazy(() => import('@/components/icons/ranks/rank-ruby-6'))
    },
    'Amethyst': {
        1: lazy(() => import('@/components/icons/ranks/rank-amethyst-1')),
        2: lazy(() => import('@/components/icons/ranks/rank-amethyst-2')),
        3: lazy(() => import('@/components/icons/ranks/rank-amethyst-3')),
        4: lazy(() => import('@/components/icons/ranks/rank-amethyst-4')),
        5: lazy(() => import('@/components/icons/ranks/rank-amethyst-5')),
        6: lazy(() => import('@/components/icons/ranks/rank-amethyst-6'))
    },
    'Onyx': {
        1: lazy(() => import('@/components/icons/ranks/rank-onyx-1')),
        2: lazy(() => import('@/components/icons/ranks/rank-onyx-2')),
        3: lazy(() => import('@/components/icons/ranks/rank-onyx-3')),
        4: lazy(() => import('@/components/icons/ranks/rank-onyx-4')),
        5: lazy(() => import('@/components/icons/ranks/rank-onyx-5')),
        6: lazy(() => import('@/components/icons/ranks/rank-onyx-6'))
    },
    'Master': {
        1: lazy(() => import('@/components/icons/ranks/rank-master-1')),
        2: lazy(() => import('@/components/icons/ranks/rank-master-2')),
        3: lazy(() => import('@/components/icons/ranks/rank-master-3')),
        4: lazy(() => import('@/components/icons/ranks/rank-master-4')),
        5: lazy(() => import('@/components/icons/ranks/rank-master-5')),
        6: lazy(() => import('@/components/icons/ranks/rank-master-6'))
    }
}

/**
 * Calculates total XP required for a specific level.
 */
const getXPForLevel = (level: number) => {
    if (level <= 1) return 0
    return Math.floor(BASE_XP * Math.pow(level - 1, EXPONENT))
}

/**
 * Calculates current level based on total XP
 */
const getLevelFromXP = (xp: number) => {
    let level = 1
    const maxLevel = RANKS.length * LEVELS_PER_RANK
    while (getXPForLevel(level + 1) <= xp && level < maxLevel) {
        level++
    }
    return level
}

/**
 * Get badge based on rank and badge index
 */
const getBadgeIcon = (rank: string, badgeIndex: number) => {
    if (!rank || !badgeIndex) return UnrankedIcon

    const rankIcon = RANKS_ICONS[rank]?.[badgeIndex]
    if (rankIcon) return rankIcon

    return UnrankedIcon
}

/**
 * Dev utility to simulate XP progression, and list required XP for each level.
 */

// @ts-ignore
window.simulateXP = () => {
    const xpProgression = []
    const maxLevels = RANKS.length * LEVELS_PER_RANK
    for (let level = 1; level <= maxLevels; level++) {
        let xp = getXPForLevel(level)

        // Get "howls per level", where 1 howl = 10xp
        const howls = Math.floor(xp / 10)
        const rankIndex = Math.floor((level - 1) / LEVELS_PER_RANK)
        const rank = RANKS[rankIndex]

        // to locale string with commas
        xpProgression.push({
            rank,
            level,
            xp: xp.toLocaleString(),
            howls: howls.toLocaleString()
        })
    }
    console.table(xpProgression)
}

/**
 * Get badge icon based on XP
 */
export function BadgeFromXP({xp, className}: {
    xp: number
    className?: string
}) {
    const currentLevel = getLevelFromXP(xp)
    const rankIndex = Math.floor((currentLevel - 1) / LEVELS_PER_RANK)
    const rank = RANKS[rankIndex]
    const badgeIndex = ((currentLevel - 1) % LEVELS_PER_RANK) + 1
    const BadgeIcon = getBadgeIcon(rank, badgeIndex)
    return <BadgeIcon className={cn('w-6 h-6 shrink-0', className)}/>
}

export function XPDisplay({xp}: { xp: number }) {
    const currentLevel = getLevelFromXP(xp)
    const nextLevel = currentLevel + 1

    const maxXP = getXPForLevel(RANKS.length * LEVELS_PER_RANK)
    const currentLevelXP = Math.min(getXPForLevel(currentLevel), maxXP)
    const nextLevelXP = Math.min(getXPForLevel(nextLevel), maxXP)

    // Calculate progress percentage within the current level tier
    const isMaxLevel = xp >= maxXP
    const range = nextLevelXP - currentLevelXP
    const progress = isMaxLevel ? 100 : Math.min(Math.max(((xp - currentLevelXP) / range) * 100, 0), 100)

    // Rank is determined by blocks of 12 levels
    const rankIndex = Math.min(Math.floor((currentLevel - 1) / LEVELS_PER_RANK), RANKS.length - 1)
    const rankName = RANKS[rankIndex]

    return (
        <div className="flex items-center gap-3 w-full">
            <BadgeFromXP xp={xp}/>
            <div className="flex flex-col gap-1 items-center w-full">
                <div className="flex justify-between w-full items-center">
                    <span className="text-xs font-bold uppercase grow text-muted-foreground select-none pointer-events-none">
                        {rankName}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground/60 select-none pointer-events-none">
                        {xp} XP
                    </span>
                </div>

                <ProgressBar
                    value={progress}
                    indeterminate={isMaxLevel}
                    className={cn('h-1.5 w-full bg-secondary rounded-full overflow-hidden', isMaxLevel && 'bg-primary-light/50 duration-5000 animate-hue-linear')}
                />
            </div>
        </div>
    )
}
