/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {Button} from '@/components/shared'
import {Heading} from '@/components/shared/heading.tsx'
import {Text} from '@/components/shared/text.tsx'
import React from 'react'
import {Alert, AlertDescription, AlertTitle} from '@/src/components'

export default function SettingsDeleteAccount() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-6">
            <div>
                <Heading>Account Deletion</Heading>
                <Text alt>
                    Account deletion is not possible through self-service yet. Please start a chat with us and we will
                    help you with the
                    deletion process.
                </Text>
                <Text alt>
                    Someone from Wildbase - or Rheo - will guide you through the process of deleting your account. This
                    is a manual process
                    that requires some time and effort from our team so please be patient!
                </Text>
                <div className="w-full border-t mt-6 pt-6">
                    <Alert variant="destructive">
                        <AlertTitle>Everything will be deleted!</AlertTitle>
                        <AlertDescription>
                            Everything we have that's linked to you will be permanently deleted, as if you never existed
                            to us. Be sure to
                            tell your friends and packs you're going!
                        </AlertDescription>
                    </Alert>
                </div>
                <Button color="red" className="mt-2">
                    Start the process
                </Button>
            </div>
        </div>
    )
}
