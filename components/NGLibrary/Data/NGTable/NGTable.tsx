import moment from 'moment/moment'
import React from 'react'
import {buildClassObject} from '@/lib/ColourScheme.utils'
import Link from 'next/link'

export declare interface NGTableType {
    headers: string[];
    data: any[];
    theme?: any;
    children?: React.ReactNode;
    className?: string;
}

export const NGTableTheming = {
    main: [],
}

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

export default function NGTable({...props}: NGTableType) {
    let theme = buildClassObject(NGTableTheming, props.theme || undefined)

    return (
        <div className={`flex flex-col ${props.className}`}>
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div
                        className="bg-card shadow overflow-hidden border-b border-default rounded-default">
                        <table className="min-w-full divide-y divide-default highlight-white/5">
                            <thead className="bg-default-alt">
                            <tr>
                                {props.headers.map((header: string, i: number) => {
                                    if (header === 'Blank') {
                                        return (
                                            <th key={i} scope="col" className="px-6 py-3"></th>
                                        )
                                    } else if (header.length > 0) {
                                        return (
                                            <th key={i} scope="col"
                                                className="text-alt px-6 py-3 text-left text-xs leading-4 font-medium uppercase tracking-wider">
                                                {header}
                                            </th>
                                        )
                                    }
                                })}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                            {props.data.map((item: any, i) => (
                                <tr key={i} className="hover:bg-default-alt">
                                    {Object.keys(item).map((key: string, i) => (
                                        // strip numbers from keys
                                        key = key.replace(/[0-9]/g, ''),
                                            <>
                                                {key === 'user' && (
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                        <Link href={`/@${item[key].username}/`}
                                                              className="flex items-center w-full">
                                                            <div className="h-10 w-10 flex-shrink-0">
                                                                <img className="h-10 w-10 rounded-full"
                                                                     src={item[key].avatar} alt=""/>
                                                            </div>
                                                            <div className="ml-4 space-y-1">
                                                                <div
                                                                    className="font-medium text-default">{item[key].display_name}</div>
                                                                <div
                                                                    className="text-alt">{item[key].username}</div>
                                                            </div>
                                                        </Link>
                                                    </td>
                                                )}

                                                {key === 'date' && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-alt">
                                                            {moment(item[key]).format('MMMM Do YYYY @ HH:mm')}
                                                        </div>
                                                    </td>
                                                )}

                                                {key !== 'user' && key !== 'date' && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-alt">
                                                            {typeof item[key] === 'function' ? item[key]() : item[key]}
                                                        </div>
                                                    </td>
                                                )}
                                            </>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
