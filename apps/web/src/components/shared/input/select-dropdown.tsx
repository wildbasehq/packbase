import {Listbox, Transition} from '@headlessui/react'
import {ArrowDownIcon, CheckBadgeIcon, CheckIcon} from '@heroicons/react/20/solid'
import {Fragment, ReactNode} from 'react'
import {clsx} from 'clsx'

export declare interface SelectMenuType {
    title: string
    selected: any
    onChange: (selected: any) => void
    options: { name: string; disabled?: boolean; verified?: boolean }[]
    displayAbove?: boolean

    theme?: any
    children?: ReactNode
}

export default function SelectMenu({...props}: SelectMenuType) {
    return (
        // @ts-ignore
        <Listbox value={props.selected} by="name" onChange={props.onChange}>
            {({open}) => (
                <>
                    <Listbox.Label
                        className="block text-sm font-medium unicorn:text-on-surface-variant">{props.title}</Listbox.Label>
                    <div className={`relative mt-1 ${props.displayAbove ? 'flex flex-col-reverse' : ''}`}>
                        <Listbox.Button
                            className="relative w-full cursor-default rounded border py-2 pl-3 pr-10 text-left focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                            <span className="text-default flex gap-1 truncate">
                                {props.selected?.name}
                                {props.selected?.verified &&
                                    <CheckBadgeIcon className="h-5 w-5 text-primary-inverse" aria-hidden="true"/>}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ArrowDownIcon className="h-5 w-5 text-on-surface-variant" aria-hidden="true"/>
                            </span>
                        </Listbox.Button>

                        <Transition show={open} as={Fragment} leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options
                                key={props.selected}
                                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded bg-card py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-hidden sm:text-sm"
                            >
                                {props.options.map((option, optionIdx) => (
                                    <Listbox.Option
                                        key={optionIdx}
                                        className={({focus}) =>
                                            clsx(
                                                focus ? 'bg-primary text-white unicorn:bg-primary-container' : 'text-default',
                                                `relative select-none py-2 pl-3 pr-9 ${option.disabled ? 'cursor-not-allowed opacity-75' : 'cursor-default'}`,
                                            )
                                        }
                                        value={option}
                                        disabled={option.disabled}
                                    >
                                        {({selected, focus}) => (
                                            <>
                                                <span
                                                    className={clsx(selected ? 'font-semibold' : 'font-normal', 'flex gap-1 truncate')}>
                                                    {option.name}
                                                    {option.verified &&
                                                        <CheckBadgeIcon className="h-5 w-5 text-primary-inverse"
                                                                        aria-hidden="true"/>}
                                                </span>

                                                {selected ? (
                                                    <span
                                                        className={clsx(
                                                            focus ? 'text-white' : 'text-on-primary-container',
                                                            'absolute inset-y-0 right-0 flex items-center pr-4',
                                                        )}
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
