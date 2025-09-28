import bentoConfig from '@/datasets/bento/conf.json'
import badgeConfig from '@/datasets/bento/pak/badges/pak.json'
import Tooltip from '@/components/shared/tooltip'
import { cn } from './cn'

export const rootDir = bentoConfig._rootDir

export function BentoStaffBadge({ type, ...props }: { type: '1' | '2'; [x: string]: any }) {
    return (
        <Tooltip content={badgeConfig.config.staff.tooltip[type] || 'Staff Badge'} side="bottom">
            <img src={`${rootDir}${badgeConfig._rootDir}staff/${type}.png`} alt="Staff badge" {...props} />
        </Tooltip>
    )
}

export function BentoGenericUnlockableBadge({ type, ...props }: { type: string; [x: string]: any }) {
    return (
        <Tooltip content={badgeConfig.config.unlockables.tooltip[type] || 'Unlockable Badge'} side="bottom" delayDuration={0}>
            {/* Pixel icon. Use bilinear filtering */}
            <img
                src={`${rootDir}${badgeConfig._rootDir}unlockables/${type}.png`}
                alt="Unlockable badge"
                className={cn(props.className, '[image-rendering:pixelated]')}
                {...props}
            />
        </Tooltip>
    )
}
