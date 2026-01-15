import {cn} from '@/src/lib'
import {motion} from 'motion/react'

export default function ProgressBar({value, indeterminate, mask = false, className}: {
    value?: number;
    indeterminate?: boolean;
    mask?: boolean;
    className?: string
}) {
    const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={indeterminate ? undefined : clamped}
            aria-busy={indeterminate || undefined}
            className={cn('w-full h-2 rounded-full overflow-hidden relative', (indeterminate || clamped === 0) ? '' : 'bg-muted', className)}
            style={mask ? {
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)',
            } : {}}
        >
            {indeterminate ? (
                <motion.div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-transparent via-primary-light to-transparent"
                    initial={{x: '-100%'}}
                    animate={{x: '100%'}}
                    transition={{duration: 0.75, repeat: Infinity}}
                    style={{width: '100%'}}
                />
            ) : (
                <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                     style={{width: `${clamped}%`}}/>
            )}
            <span className="sr-only">{indeterminate ? 'Loading' : `Progress: ${clamped}%`}</span>
        </div>
    )
}
