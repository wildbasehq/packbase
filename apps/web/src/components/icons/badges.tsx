import {BadgeFromXP} from '@/components/icons/ranks/xp-display'
import {BentoGenericUnlockableBadge, BentoStaffBadge} from '@/lib/utils/pak'

export function Badges({xp, staffBadge, genericUnlock, className}: {
    xp?: number
    staffBadge?: '1' | '2'
    genericUnlock?: string
    className?: string
}) {
    return (
        <>
            {/* Level */}
            {xp && (
                <BadgeFromXP xp={xp} className={className}/>
            )}

            {/* Staff */}
            {staffBadge && (
                <BentoStaffBadge
                    type={staffBadge}
                    className={className}
                    width={16}
                    height={16}
                />
            )}

            {/* Generic user unlocks */}
            {genericUnlock && (
                <BentoGenericUnlockableBadge
                    type={genericUnlock}
                    className={className}
                    width={16}
                    height={16}
                />
            )}
        </>
    )
}