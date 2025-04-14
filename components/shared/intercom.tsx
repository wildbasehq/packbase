import Intercom from '@intercom/messenger-js-sdk'

export default function IntercomComponent({ user, children }: { user: any; children: React.ReactNode }) {
    if (typeof window !== 'undefined') {
        Intercom({
            app_id: 'tsv507d0',
            ...(user && {
                user_id: user.id,
                name: user.username,
                email: user.email,
                created_at: user.created_at,
            }),
        })
    }

    return children
}
