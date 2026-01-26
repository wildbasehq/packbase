import {defineConfig} from 'prisma/config'

// comment is here PURELY so that railway fucking listens
export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: process.env.DIRECT_URL
    }
})