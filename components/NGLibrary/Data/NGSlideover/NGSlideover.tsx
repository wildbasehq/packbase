'use client';
import React, {Fragment} from 'react';
import {Dialog, Transition} from "@headlessui/react";
import {XMarkIcon} from "@heroicons/react/24/outline";

export function NGSlideover({...props}: {
    open: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    expandNatural?: boolean; // default: false, expands to largest size possible, up to 1/4 of screen
    className?: string;
    children: React.ReactNode;
}) {
    const [open, setOpen] = props.open;

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="fixed inset-0 overflow-hidden z-50" onClose={setOpen}>
                <div className="absolute inset-0 overflow-hidden">
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-100"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Dialog.Overlay
                            className="fixed inset-0 bg-neutral-500/25 bg-opacity-75 transition-opacity"/>
                    </Transition.Child>
                    <div className={`pointer-events-none fixed inset-y-0 right-0 flex ${props.expandNatural ? 'min-w-full md:min-w-[50%] lg:min-w-[25%] md:max-w-screen-md -10' : 'lg:w-[25%]'}`}>
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-out duration-150 sm:ease-snapper sm:duration-300"
                            enterFrom="transform opacity-0 scale-110 sm:translate-x-full sm:scale-100 sm:opacity-100"
                            enterTo="transform opacity-100 scale-100  sm:translate-x-0 sm:scale-100 sm:opacity-100"
                            leave="transition ease-in duration-150 sm:ease-snapper sm:duration-300"
                            leaveFrom="transform opacity-100 scale-100 sm:translate-x-0 sm:scale-100 sm:opacity-100"
                            leaveTo="transform opacity-0 scale-110  sm:translate-x-full sm:scale-100 sm:opacity-100"
                        >
                            <div className="w-full pointer-events-auto relative grid">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-in-out duration-500"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in-out duration-500"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="absolute top-0 right-0 flex p-4 z-50 lg:left-0 lg:-ml-10 lg:pr-4 lg:pt-4 lg:pl-0 lg:pb-0">
                                        <button
                                            type="button"
                                            className="rounded-md text-default hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                                            onClick={() => setOpen(false)}
                                        >
                                            <span className="sr-only">Close panel</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                </Transition.Child>
                                <div className={`${props.className} h-full overflow-y-auto bg-default p-8`}>
                                    <div className="space-y-6 pb-16">
                                        {props.children}
                                    </div>
                                </div>
                            </div>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}