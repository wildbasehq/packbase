/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {Button, Heading, Text} from '@/components/shared'

export default function ResourceDeletePage() {
    return (
        <div className="flex flex-1 flex-col gap-4">
            <div>
                <Heading>Pack Deletion</Heading>
                <Text alt>
                    Pack deletion is not possible through self-service yet. Please start a chat with us and we will help
                    you with the
                    deletion process.
                </Text>
                <Text alt>
                    Someone from Wildbase - or Rheo - will guide you through the process of deleting your pack. This is
                    a manual process
                    that requires some time and effort from our team. Be sure to alert your community before doing this.
                </Text>
                <Button color="red" className="mt-2">
                    Start the process
                </Button>
            </div>
        </div>
    )
}
