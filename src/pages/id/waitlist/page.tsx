import { Waitlist } from '@clerk/clerk-react'

export default function IDWaitlist() {
    return (
        <div className="shadow-xs ring-1 ring-n-5/10 rounded overflow-clip">
            <Waitlist signInUrl="/id/login" />
        </div>
    )
}
