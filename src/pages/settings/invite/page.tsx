import React from 'react'
import { CrawlText } from '@/components/shared/crawl-text'
import { Alert, AlertDescription } from '@/src/components'

const InviteSettings: React.FC = () => {
    return (
        <div>
            <div className="border-b pb-4 mb-4 border-n-5/10">
                <h1 className="font-bold text-[17px]">Invite User</h1>
                <p className="text-sm text-muted-foreground">Invite a user into Packbase earlier, skipping the waitlist.</p>
            </div>

            <Alert>
                <AlertDescription>
                    We've recently changed how inviting works. You'll now need the user's email address rather than generating an invite
                    code.
                </AlertDescription>
            </Alert>
        </div>
    )
}

export default InviteSettings
