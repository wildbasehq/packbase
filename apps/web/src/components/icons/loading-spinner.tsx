/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import styles from './loading-spinner.module.css'
import {CSSProperties} from "react";
import {cn} from "@/lib";

export default function LoadingSpinner({className, speed = 0.5}: { className?: string; speed?: number }) {
    return (
        <div
            className={cn('dark:invert', styles.spinner, className)}
            style={
                {
                    '--spinner-duration': `${speed}s`,
                } as CSSProperties
            }
        >
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    )
}
