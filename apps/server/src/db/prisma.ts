import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'
import Debug from 'debug'

const log = {
    info: Debug('vg:prisma'),
    error: Debug('vg:prisma:error'),
}

// Add prisma to the NodeJS global type
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})

// Prevent multiple instances of Prisma Client in development
const prisma = new PrismaClient({adapter})

// @ts-ignore
global.prisma = prisma

// Initialize the client
prisma.$connect()
    .then(() => {
        log.info('Prisma client connected to database')
    })
    .catch((error) => {
        log.error('Failed to connect to database', error)
    })

export default prisma
