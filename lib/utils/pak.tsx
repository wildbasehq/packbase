import bentoConfig from '@/datasets/bento/conf.json'
import badgeConfig from '@/datasets/bento/pak/badges/pak.json'
import Image from 'next/image'
import Tooltip from '@/components/shared/tooltip'

export const rootDir = bentoConfig._rootDir

export function BentoStaffBadge({type, ...props}: {
    type: '1' | '2'
    [x: string]: any
}) {
    return (
        <Tooltip content={badgeConfig.config.staff.tooltip[type] || 'Staff Badge'}>
            <Image unoptimized src={`${rootDir}${badgeConfig._rootDir}staff/${type}.png`} alt="Staff badge" {...props} />
        </Tooltip>
    )
}