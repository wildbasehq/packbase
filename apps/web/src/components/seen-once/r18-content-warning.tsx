/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useEffect, useState} from 'react'
import {Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle} from '@/components/shared/dialog'
import {Button, Text} from '@/components/shared'
import PackbaseInstance from '@/lib/workers/global-event-emit.ts'
import {useLocalStorage} from "usehooks-ts";

export default function R18ContentWarning() {
    const [isOpen, setIsOpen] = useState(false)
    const [doNotAskAgain, setDoNotAskAgain] = useLocalStorage<boolean>('r18-content-opt-in', false)
    const [tags, setTags] = useState<string[]>([])

    useEffect(() => {
        // Listen for age verification request event
        const unsubscribe = PackbaseInstance.on('request-r18-confirmation', (event) => {
            // Only show modal if user hasn't already verified their age
            if (!doNotAskAgain) {
                setIsOpen(true)
            }

            setTags(event.data?.r18_tags || [])
        })

        // Cleanup listener on unmount
        return () => {
            unsubscribe()
        }
    }, [doNotAskAgain])

    const handleConfirmDoNotAskAgain = () => {
        setDoNotAskAgain(true)
        setIsOpen(false)
    }

    const handleConfirm = () => {
        setIsOpen(false)
    }

    const handleDecline = () => {
        setIsOpen(false)
        // Redirect to a safe page or homepage
        window.location.href = '/'
    }

    return (
        <>
            <Dialog
                open={isOpen}
                onClose={() => {
                }} // Prevent closing without a choice
                size="md"
                aria-labelledby="r18-confirmation-title"
                aria-describedby="r18-confirmation-description"
                blurBackground
            >
                <div className="p-6">
                    <DialogTitle id="r18-confirmation-title">
                        Profile contains R18 Content
                    </DialogTitle>
                    <DialogBody>
                        <DialogDescription id="r18-confirmation-description">
                            Confirm that you'd like to see content intended for adults only (18+).
                            <br/><br/>
                            {tags.length > 0 && (
                                <>
                                    This profile has been tagged with the following adult content warnings:
                                    <ul className="list-disc list-inside mt-2">
                                        {/* Show only 5. If more, display a count after */}
                                        {tags.slice(0, 5).map((tag) => (
                                            <li key={tag}>
                                                {tag}
                                            </li>
                                        ))}
                                        {tags.length > 5 && (
                                            <li className="italic text-sm">
                                                and {tags.length - 5} more...
                                            </li>
                                        )}
                                    </ul>
                                </>
                            )}
                        </DialogDescription>
                    </DialogBody>
                    <DialogActions>
                        <Button
                            onClick={handleDecline}
                            color="zinc"
                            aria-label="I do not wish to proceed"
                        >
                            Take me back
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            color="indigo"
                            aria-label="I want to see adult content"
                        >
                            Confirm
                        </Button>
                    </DialogActions>
                    <Text
                        size="xs"
                        alt
                        className="w-fit my-4 underline cursor-pointer float-end"
                        onClick={handleConfirmDoNotAskAgain}
                        aria-label="I want to see adult content and do not want to be asked again"
                    >
                        Continue and shut up about it
                    </Text>
                </div>
            </Dialog>
        </>
    )
}