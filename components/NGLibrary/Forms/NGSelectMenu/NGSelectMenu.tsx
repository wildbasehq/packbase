'use client'
import {Listbox, Transition} from '@headlessui/react'
import {ArrowDownIcon, CheckIcon} from '@heroicons/react/20/solid'
import React, {Fragment} from 'react'

export declare interface NGSelectMenuType {
    title: string;
    selected: any;
    onChange: (selected: any) => void;
    options: { name: string; disabled?: boolean; }[];
    displayAbove?: boolean;

    theme?: any;
    children?: React.ReactNode;
}

export const NGSelectMenuTheming = {
    main: [],
}

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

export default function NGSelectMenu({...props}: NGSelectMenuType) {
    return (
        // @ts-ignore
        <Listbox value={props.selected} by="name" onChange={props.onChange}>
            {({open}) => (
                <>
                    <Listbox.Label className="block text-sm font-medium text-alt">{props.title}</Listbox.Label>
                    <div className={`mt-1 relative ${props.displayAbove ? 'flex flex-col-reverse' : ''}`}>
                        <Listbox.Button
                            className="bg-card relative w-full border border-solid border-default rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <span className="block truncate text-default">{props.selected?.name}</span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ArrowDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true"/>
                            </span>
                        </Listbox.Button>

                        <Transition
                            show={open}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options
                                key={props.selected}
                                className="absolute z-10 mt-1 w-full bg-card shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                {props.options.map((option, optionIdx) => (
                                    <Listbox.Option
                                        key={optionIdx}
                                        className={({active}) => classNames(active ? 'text-white bg-indigo-600' : 'text-default', `select-none relative py-2 pl-3 pr-9 ${option.disabled ? 'cursor-not-allowed opacity-75' : 'cursor-default'}`)}
                                        value={option}
                                        disabled={option.disabled}

                                    >
                                        {({
                                              selected,
                                              active,
                                          }) => (
                                            <>
                                                <span
                                                    className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                                                    {option.name}
                                                </span>

                                                {selected ? (
                                                    <span
                                                        className={classNames(active ? 'text-white' : 'text-indigo-600', 'absolute inset-y-0 right-0 flex items-center pr-4')}
                                                    >
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true"/>
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </Transition>
                    </div>
                </>
            )}
        </Listbox>
    )
}
