import PlaceholderNotification from '@/components/icons/placeholder-notification.tsx'
import {Container} from '@/components/layout/container.tsx'
import {Heading, Text} from '@/components/shared/text.tsx'
import {Slideover} from '@/components/modal/slideover.tsx'
import {useEffect, useState} from 'react'
import {DialogTitle} from '@/components/shared/dialog.tsx'

export default function InboxPage({onClose}) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        setOpen(true)
    }, [])

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!open) {
                console.log('Closing!')
                onClose()
            }
        }, 250)
        return () => clearTimeout(timeout)
    }, [open])

    return (
        <Slideover open={[open, setOpen]} className="w-full sm:w-[400px]" navbar={<DialogTitle>Inbox</DialogTitle>}>
            <Container className="flex flex-col items-center justify-center h-full">
                <div className="flex flex-col items-center justify-center">
                    <PlaceholderNotification className="mb-4 text-neutral-50 dark:text-n-8"/>
                    <Heading size="xl">Nothing here, bud!</Heading>
                    <Text className="text-center">You don't have any notifications yet.</Text>
                </div>
            </Container>
        </Slideover>
    )
}