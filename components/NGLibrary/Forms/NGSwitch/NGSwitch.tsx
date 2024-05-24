'use client'
import React, {useEffect, useState} from 'react'
// @ts-ignore
import {buildClassObject} from '@/lib/ColourScheme.utils'
import {Switch} from '@headlessui/react'

export declare interface NGSwitchType {
    enabled?: boolean;
    disabled?: boolean;
    reverse?: boolean;
    title?: string;
    description?: string;
    onChange?: Function;
    theme?: any;
    children?: React.ReactNode;
}

export const NGSwitchTheming = {
    main: [],
}

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

export default function NGSwitch({...props}: NGSwitchType) {
    let theme = buildClassObject(NGSwitchTheming, props.theme || undefined)
    const [enabled, setEnabled] = useState(props.enabled)

    useEffect(() => {
        props.onChange && props.onChange(enabled)
    }, [enabled])

    useEffect(() => {
        setEnabled(props.enabled || false)
    }, [props.enabled])

    return (
        <Switch.Group as="div"
                      className={`flex items-center justify-between ${props.reverse ? 'flex-row-reverse' : ''}`}>
            {(props.title || props.description) && (
                <span className="flex-grow flex flex-col">
                    {props.title && (
                        <Switch.Label as="span" className="text-sm font-medium text-default" passive>
                            {props.title}
                        </Switch.Label>
                    )}
                    {props.description && (
                        <Switch.Description as="p" className="text-sm text-alt">
                            {props.description}
                        </Switch.Description>
                    )}
                </span>
            )}
            <Switch
                checked={enabled}
                onChange={setEnabled}
                className={classNames(
                    enabled ? 'bg-indigo-600' : 'bg-gray-200',
                    `${props.reverse ? 'mr-4' : ''} ${props.disabled ? 'opacity-75 cursor-not-allowed' : ''} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`
                )}
                disabled={props.disabled}
            >
                <span className="sr-only">{props.title || 'Use setting'}</span>
                <span
                    className={classNames(
                        enabled ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none relative inline-block h-5 w-5 my-auto rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                    )}
                >
                    <span
                        className={classNames(
                            enabled ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200',
                            'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
                        )}
                        aria-hidden="true"
                    >
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                            <path
                                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    <span
                        className={classNames(
                            enabled ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100',
                            'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
                        )}
                        aria-hidden="true"
                    >
                        <svg className="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                            <path
                                d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z"/>
                        </svg>
                    </span>
                </span>
            </Switch>
        </Switch.Group>
    )
}
