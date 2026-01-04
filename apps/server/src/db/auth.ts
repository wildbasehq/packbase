import {createClerkClient} from '@clerk/backend'
import Debug from 'debug'

const log = {
    info: Debug('vg:clerk'),
    error: Debug('vg:clerk:error'),
}

const clerkClient = createClerkClient({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY
})

export default clerkClient

// Test the client connection
async function clientTest() {
    const clientTest = await clerkClient.users.getUserList({limit: 1})

    if (!!clientTest.data) {
        log.info('Clerk client connected')
    } else {
        log.error('Clerk client failed to connect')
        process.exit(1)
    }
}

try {
    await clientTest()
} catch (error) {
    log.error('Clerk client failed to connect', error)
    process.exit(1)
}
