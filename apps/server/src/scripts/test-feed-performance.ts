import {FeedController} from '@/lib/feed-controller'

async function testFeedPerformance() {
    const userId = process.argv.find((arg) => arg.startsWith('--userId='))?.split('=')[1] || 'test-user-id'
    const feedController = new FeedController()

    console.time('Feed Loading')

    try {
        const homeResult = await feedController.getHomeFeed(userId, 1)
        console.log(`Home feed loaded ${homeResult.data.length} posts`)

        // Test user feed
        const userResult = await feedController.getUserFeed(userId, 1)
        console.log(`User feed loaded ${userResult.data.length} posts`)

        // You can test other feed types here
    } catch (error) {
        console.error('Error:', error)
    }

    console.timeEnd('Feed Loading')
}

testFeedPerformance()
