import {defineConfig} from 'prisma/config'

// comment is here PURELY so that railway fucking listens
export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: process.env.DATABASE_URL
    }
})