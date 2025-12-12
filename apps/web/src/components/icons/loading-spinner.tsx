/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import styles from './loading-spinner.module.css'
import {cn} from "@/lib";

const bars = Array(12).fill(0)

export default function LoadingSpinner({
                                           color,
                                           size = 20,
                                           className
                                       }: {
    color?: string
    size?: number
    className?: string
}) {
    const colorDynamic = 'var(--muted-foreground)'
    return (
        <div
            className={cn(styles.wrapper, className)}
            style={
                {
                    '--spinner-size': `${size}px`,
                    '--spinner-color': color || colorDynamic
                } as React.CSSProperties
            }
        >
            <div className={styles.spinner}>
                {bars.map((_, i) => (
                    <div className={styles.bar} key={`spinner-bar-${i}`}/>
                ))}
            </div>
        </div>
    )
}