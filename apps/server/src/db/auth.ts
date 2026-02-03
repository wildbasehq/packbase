import {createClerkClient} from '@clerk/backend'

const clerkClient = createClerkClient({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY
})

export default clerkClient
