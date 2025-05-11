import React from 'react'
import {Dialog, DialogBackdrop, DialogPanel} from '@headlessui/react'
import {XMarkIcon} from '@heroicons/react/24/outline'

export function Slideover({
                              ...props
                          }: {
    open: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
    expandNatural?: boolean // default: false, expands to largest size possible, up to 1/4 of screen
    className?: string
    navbar?: React.ReactNode
    children: React.ReactNode
}) {
    const [open, setOpen] = props.open

    return (
        <Dialog open={open} onClose={setOpen} className="relative z-10">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-n-5/75 transition-opacity duration-250 ease-in-out data-closed:opacity-0 dark:bg-black/30 backdrop-blur-[1px]"
            />

            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                        <DialogPanel
                            transition
                            className="pointer-events-auto relative w-screen sm:max-w-md transform transition duration-200 ease-snapper data-closed:translate-x-full sm:duration-350"
                        >
                            <div className="flex h-full flex-col overflow-y-auto bg-neutral-100 dark:bg-n-7 shadow-xl">
                                <div className="px-4 sm:px-6 bg-white dark:bg-n-8 h-18 border-b flex items-center justify-between">
                                    {props.navbar}
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="relative bg-n-1 dark:bg-n-9 p-1.5 rounded-md ring-default focus:ring-2 focus:outline-hidden"
                                    >
                                        <span className="absolute -inset-2.5"/>
                                        <span className="sr-only">Close panel</span>
                                        <XMarkIcon aria-hidden="true" className="size-4"/>
                                    </button>
                                </div>
                                <div className="relative mt-6 py-6 flex-1 px-4 sm:px-6">
                                    {props.children}
                                </div>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </div>
        </Dialog>
    )
}
