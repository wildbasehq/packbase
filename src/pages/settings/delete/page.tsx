import { Button } from '@/components/shared/experimental-button-rework'
import { Heading } from '@/components/shared/heading'
import { Text } from '@/components/shared/text'
import React from 'react'

export default function SettingsDeleteAccount() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-6">
            <div>
                <Heading>Account Deletion</Heading>
                <Text alt>
                    Account deletion is not possible through self-service yet. Please start a chat with us and we will help you with the
                    deletion process.
                </Text>
                <Text alt>
                    Someone from Wildbase - or Rheo - will guide you through the process of deleting your account. This is a manual process
                    that requires some time and effort from our team so please be patient!
                </Text>
                <Button
                    onClick={() => {
                        if (window.Intercom) {
                            window.Intercom('show')
                        }
                    }}
                    color="red"
                    className="mt-2"
                >
                    Start the process
                </Button>
            </div>
        </div>
    )
}
