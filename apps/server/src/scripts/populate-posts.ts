import prisma from '@/db/prisma'
import {faker} from '@faker-js/faker'

async function main() {
    const [, , limitArg] = process.argv

    const limit = limitArg ? Number.parseInt(limitArg, 10) : 100
    if (Number.isNaN(limit) || limit <= 0) {
        console.error('LIMIT must be a positive integer if provided, got ' + limitArg)
        process.exit(1)
    }

    /**
     * Populate users first and get a user ID to associate posts with.
     *
     * Creates `limitArg` numbre of users
     */
    let createdUsers = 0
    let createdPosts = 0
    await Promise.all(
        Array.from({length: limit}).map(async () => {
                const {id: userId} = await prisma.profiles.create({
                    data: {
                        username: faker.internet.username(),
                        display_name: faker.person.fullName(),
                        owner_id: 'system',
                    },
                    select: {
                        id: true,
                    },
                })

                createdUsers += 1

                const texts = Array.from({length: limit}, () => {
                    const title = faker.lorem.sentence({min: 3, max: 8})
                    const paragraphs = faker.lorem.paragraphs({min: 2, max: 6}, '\n\n')
                    const listItems = Array.from({
                        length: faker.number.int({
                            min: 2,
                            max: 5
                        })
                    }, () => `- ${faker.lorem.sentence()}`).join('\n')
                    const codeBlock = '```ts\n' + faker.lorem.sentences({min: 1, max: 3}) + '\n```'
                    return `# ${title}\n\n${paragraphs}\n\n${listItems}\n\n${codeBlock}`
                })

                if (texts.length === 0) {
                    console.error('No data to insert')
                    process.exit(1)
                }

                console.log(`Creating ${texts.length} posts for user ${userId} ...`)

                try {
                    const data = texts.map((body) => ({
                        content_type: 'markdown',
                        body,
                        user_id: userId,
                    }))

                    const result = await prisma.posts.createMany({data})
                    createdPosts += result.count
                    console.log(`Inserted ${result.count} posts.`)
                } catch (error) {
                    console.error('Failed to populate posts:', error)
                    process.exitCode = 1
                } finally {
                    await prisma.$disconnect()
                }
            }
        )
    )

    console.log(`Created ${createdUsers} users and ${createdPosts} posts in total.`)
}

main()
