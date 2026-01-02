import { PresenceExtension, usePresence } from '@/lib/socket/useProvider'
import { useEffect, useState } from 'react'

export default function Test() {
    const { isSupported, presenceData, updateStatus, subscribeAll } = usePresence()

    const [customStatus, setCustomStatus] = useState('')

    // Subscribe to presence updates on mount
    useEffect(() => {
        if (!isSupported) return

        console.log('Presence is supported')

        // Alternatively, subscribe to all users
        subscribeAll()

        // Set initial status
        updateStatus({
            statusType: PresenceExtension.StatusType.ONLINE,
        })
    }, [isSupported])

    // Handle custom status update
    const handleCustomStatusUpdate = () => {
        updateStatus({
            statusType: PresenceExtension.StatusType.ONLINE,
            statusText: customStatus,
            expiresIn: 3600, // 1 hour
        })
    }

    if (!isSupported) {
        return <div>Presence not supported by server</div>
    }

    return (
        <div>
            <h2>User Presence</h2>

            <div>
                <label>
                    Custom Status:
                    <input type="text" value={customStatus} onChange={e => setCustomStatus(e.target.value)} />
                </label>
                <button onClick={handleCustomStatusUpdate}>Update</button>
            </div>
            <div>
                <h3>Presence Data</h3>
                <pre>{JSON.stringify(presenceData, null, 2)}</pre>
            </div>
            <div>
                <h3>Presence Status</h3>
                {presenceData.map(user => (
                    <div key={user.userId}>
                        <strong>{user.userId}</strong>: {user.statusType}
                        {user.statusText && ` (${user.statusText})`}
                    </div>
                ))}
            </div>
        </div>
    )
}
