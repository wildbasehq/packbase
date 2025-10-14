/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'
import {useSession} from "@clerk/clerk-react";

/**
 * Generate a RGB color based on the user ID
 * @param userID
 */
function userIDColorSeed(userID: string) {
    let hash = 0;
    for (let i = 0; i < userID.length; i++) {
        hash = userID.charCodeAt(i) + ((hash << 5) - hash);
    }

    const r = Math.abs((hash & 0xFF0000) >> 16);
    const g = Math.abs((hash & 0x00FF00) >> 8);
    const b = Math.abs(hash & 0x0000FF);

    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Gets `navigator.userAgentData` and stringifies the entire object, including nested objects.
 */
function fingerThem() {
    const userAgentData = {
        acn: navigator.appCodeName,
        ait: navigator.appVersion,
        an: navigator.appName,
        // @ts-ignore
        dm: navigator.deviceMemory,
        av: navigator.vendor,
        ap: navigator.platform,
        apt: navigator.product,
        apts: navigator.productSub,
        c: navigator.cookieEnabled,
        dpr: window.devicePixelRatio,
        do: navigator.doNotTrack,
        dl: navigator.language,
    }
    return JSON.stringify(userAgentData, (_key, value) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.fromEntries(
                Object.entries(value).map(([k, v]) => [k, v === undefined ? 'undefined' : v])
            );
        }
        return value;
    }, 2);
}

export function ConfidentialOverlay() {
    const {session} = useSession()
    const id = session?.user?.id || `guest_`
    const color = userIDColorSeed(id)

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
            {/* Cross pattern SVG */}
            <svg className="w-full h-full absolute inset-0 opacity-5" style={{minHeight: '200vh', minWidth: '200vw'}}>
                <defs>
                    <pattern
                        id="cross-pattern"
                        x="0"
                        y="0"
                        width="400"
                        height="400"
                        patternUnits="userSpaceOnUse"
                    >
                        {/* Diagonal line from top-left to bottom-right */}
                        <line
                            x1="0"
                            y1="0"
                            x2="400"
                            y2="400"
                            stroke={color}
                            strokeWidth="2"
                        />
                        {/* Diagonal line from bottom-left to top-right */}
                        <line
                            x1="0"
                            y1="400"
                            x2="400"
                            y2="0"
                            stroke={color}
                            strokeWidth="2"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cross-pattern)"/>
            </svg>

            {/* Text pattern SVG */}
            <svg className="w-full h-full absolute inset-0 opacity-10" style={{minHeight: '200vh', minWidth: '200vw'}}>
                <defs>
                    <pattern
                        id="confidential-pattern"
                        x="0"
                        y="0"
                        width="500"
                        height="290"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(-45)"
                    >
                        <text
                            x="0"
                            y="125"
                            fill={color}
                            fontWeight="bold"
                            fontSize="32"
                            fontFamily="sans-serif"
                        >
                            ✱BASE INTERNAL
                        </text>
                        <text
                            x="0"
                            y="50"
                            fill={color}
                            fontWeight="bold"
                            fontSize="12"
                            fontFamily="sans-serif"
                        >
                            {id.split('_')[1]}
                        </text>
                        <text
                            x="0"
                            y="25"
                            fill={color}
                            fontWeight="bold"
                            fontSize="12"
                            fontFamily="sans-serif"
                        >
                            &copy; ✱base {new Date().getFullYear()} DON'T STEAL OUR WORK
                        </text>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#confidential-pattern)"/>
            </svg>
        </div>
    )
}
