import React, { Fragment } from 'react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function Slideover({
    ...props
}: {
    open: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
    expandNatural?: boolean // default: false, expands to largest size possible, up to 1/4 of screen
    className?: string
    children: React.ReactNode
}) {
    const [open, setOpen] = props.open

    return (
        <Transition show={open} as={Fragment}>
            <Dialog as="div" className="fixed inset-0 z-40 overflow-hidden" onClose={() => setOpen(false)}>
                <div className="absolute inset-0 overflow-hidden">
                    <TransitionChild
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-100"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-neutral-500/25 bg-opacity-75 transition-opacity" />
                    </TransitionChild>
                    <DialogPanel
                        className={`pointer-events-none fixed inset-y-0 right-0 flex ${
                            props.expandNatural ? '-10 min-w-full md:min-w-[50%] md:max-w-(--breakpoint-md) lg:min-w-[25%]' : 'lg:w-[25%]'
                        }`}
                    >
                        <TransitionChild
                            as={Fragment}
                            enter="transition ease-out duration-150 sm:ease-snapper sm:duration-300"
                            enterFrom="transform opacity-0 scale-110 sm:translate-x-full sm:scale-100 sm:opacity-100"
                            enterTo="transform opacity-100 scale-100  sm:translate-x-0 sm:scale-100 sm:opacity-100"
                            leave="transition ease-in duration-150 sm:ease-snapper sm:duration-300"
                            leaveFrom="transform opacity-100 scale-100 sm:translate-x-0 sm:scale-100 sm:opacity-100"
                            leaveTo="transform opacity-0 scale-110  sm:translate-x-full sm:scale-100 sm:opacity-100"
                        >
                            <div className="pointer-events-auto relative grid w-full">
                                <TransitionChild
                                    as={Fragment}
                                    enter="ease-in-out duration-500"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in-out duration-500"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="absolute right-0 top-0 z-50 flex p-4 lg:left-0 lg:-ml-10 lg:pb-0 lg:pl-0 lg:pr-4 lg:pt-4">
                                        <button
                                            type="button"
                                            className="text-default rounded-md hover:text-white focus:outline-hidden focus:ring-2 focus:ring-white"
                                            onClick={() => setOpen(false)}
                                        >
                                            <span className="sr-only">Close panel</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                </TransitionChild>
                                <div className={`${props.className} h-full overflow-y-auto bg-card`}>
                                    <div className="space-y-6 pb-16">{props.children}</div>
                                </div>
                            </div>
                        </TransitionChild>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    )
}
