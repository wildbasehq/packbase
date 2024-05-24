'use client'
import React, {useEffect, useState} from 'react'
// @ts-ignore
import {buildClassObject} from '@/lib/ColourScheme.utils'

export declare interface NGStatsGridType {
    stats?: {
        name: string; stat: string;
    }[];

    theme?: any;
    children?: React.ReactNode;
}

export const NGStatsGridTheming = {
    main: [],
}

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

export default function NGStatsGrid({...props}: NGStatsGridType) {
    let theme = buildClassObject(NGStatsGridTheming, props.theme || undefined)
    const [stats, setStats] = useState<{
        name: string; stat: string;
    }[]>([{
        name: 'Cummies',
        stat: '69',
    }])

    useEffect(() => {
        setStats(props.stats || [{
            name: 'Cummies',
            stat: '69',
        }])
    }, [props.stats])

    return (
        <div className="w-full">
            <h3 className="text-lg leading-6 font-medium text-default">Now</h3>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {stats.map((item) => (
                    <div key={item.name} className="rounded-default shadow">
                        <div className="px-4 py-5 bg-card highlight-white/5 rounded-default overflow-hidden sm:p-6">
                            <dt className="text-sm font-medium text-alt truncate">{item.name}</dt>
                            <dd className="mt-1 text-3xl font-semibold text-default">{item.stat}</dd>
                        </div>
                    </div>
                ))}
            </dl>
        </div>
    )
}
