'use client'
import {Group} from '@/lib/api/groups/types'
import React, {useState} from 'react'
import {buildClassObject} from '@/lib/ColourScheme.utils'
import Link from 'next/link'

export declare interface NGGroupCardType {
    group: Group;

    theme?: any;
    children?: React.ReactNode;
}

export const NGGroupCardTheming = {
    main: [],
}

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

export default function NGGroupCard({...props}: NGGroupCardType) {
    let theme = buildClassObject(NGGroupCardTheming, props.theme || undefined)
    const [group, setGroup] = useState<Group>(props.group)

    return (
        <div>
            <div className="flex flex-col rounded bg-card border border-default highlight-white/5">
                {/* Banner */}
                <div className="aspect-banner rounded bg-card" style={{
                    background: `url(${group.banner}) no-repeat center center/cover`,
                }}></div>

                <div className="space-y-4 justify-between items-center px-4 py-2">
                    <Link href={`/pack/${group.id}/`} className="flex flex-row space-x-2 text-default">
                        <div className="flex-none w-8 h-8 rounded-full bg-card" style={{
                            background: `url(${group.avatar}) no-repeat center center/cover`,
                        }}></div>
                        <div className="flex flex-col">
                            <h3 className="text-lg">{group.name}</h3>
                            <p className="text-sm text-neutral-500">{group.description}</p>
                        </div>
                    </Link>

                    <div className="flex flex-row">
                        <div className="flex flex-row flex-grow items-center space-x-2">
                            <div className="flex flex-col">
                                <p className="text-sm text-default">Members</p>
                                <p className="text-sm text-alt">{group.meta?.members?.count}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
